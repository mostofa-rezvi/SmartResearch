const { execSync } = require('child_process');
const neo4j = require('neo4j-driver');

async function runUAT() {
    console.log("Starting UAT API tests...");
    
    // Config
    const apiUrl = 'http://localhost:5000/api/v1'; // fixed v1
    const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const neo4jUser = process.env.NEO4J_USER || 'neo4j';
    const neo4jPassword = process.env.NEO4J_PASSWORD || 'password';

    const timestamp = Date.now();
    const studentData = { email: `student${timestamp}@example.com`, password: 'Password123!', name: 'UAT Student' };
    const mentorData = { email: `mentor${timestamp}@example.com`, password: 'Password123!', name: 'UAT Mentor' };

    try {
        // 1. Register users
        console.log("Registering users...");
        let res = await fetch(`${apiUrl}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(studentData) });
        let studentAuth = await res.json();
        
        res = await fetch(`${apiUrl}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(mentorData) });
        let mentorAuth = await res.json();

        // Bypass Email Verification
        console.log("Verifying users in DB...");
        execSync(`docker exec rb-postgres psql -U postgres -d researchbridge -c "UPDATE users SET is_verified = true WHERE email IN ('${studentData.email}', '${mentorData.email}');"`);

        // Trigger GraphSync manually by inserting a profile.created event for them just in case Redis stream missed it because of quick registration/verification
        // Actually, the graphSync worker only creates the node when they first sign up, so it should exist if GraphSyncWorker processed it. Let's assume it processed it.
        // Let's add a small delay to allow GraphSyncWorker to process the Redis stream
        await new Promise(r => setTimeout(r, 2000));

        // Login
        console.log("Logging in...");
        res = await fetch(`${apiUrl}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: studentData.email, password: studentData.password}) });
        let studentLogin = await res.json();
        if (!studentLogin.success) {
            console.error("Student login failed:", studentLogin);
            return;
        }
        const studentToken = studentLogin.data ? studentLogin.data.accessToken : studentLogin.accessToken;
        const studentId = studentLogin.data ? studentLogin.data.user.id : studentLogin.user.id;

        res = await fetch(`${apiUrl}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: mentorData.email, password: mentorData.password}) });
        let mentorLogin = await res.json();
        if (!mentorLogin.success) {
            console.error("Mentor login failed:", mentorLogin);
            return;
        }
        const mentorToken = mentorLogin.data ? mentorLogin.data.accessToken : mentorLogin.accessToken;
        const mentorId = mentorLogin.data ? mentorLogin.data.user.id : mentorLogin.user.id;

        console.log(`Tokens obtained. Student ID: ${studentId}, Mentor ID: ${mentorId}`);

        // 2. Request mentorship
        console.log("Requesting mentorship...");
        res = await fetch(`${apiUrl}/mentorship/request`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}`},
            body: JSON.stringify({ mentor_id: mentorId, message: 'Please mentor me' })
        });
        const requestData = await res.json();
        if (!requestData.success) {
            console.error("Request error:", requestData);
            return;
        }
        const requestId = requestData.data ? requestData.data.id : requestData.id;

        // 3. Accept mentorship
        console.log("Accepting mentorship...");
        res = await fetch(`${apiUrl}/mentorship/${requestId}/respond`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${mentorToken}`},
            body: JSON.stringify({ status: 'accepted' })
        });
        const acceptData = await res.json();
        if (!acceptData.success) {
            console.error("Accept error:", acceptData);
        }

        // Verify Neo4j
        console.log("Verifying Neo4j edge...");
        const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
        const session = driver.session();
        const result = await session.run(
            `MATCH (s:Researcher {userId: $studentId})-[r:MENTORS]->(m:Researcher {userId: $mentorId}) RETURN r`,
            { studentId: parseInt(studentId, 10), mentorId: parseInt(mentorId, 10) }
        );
        if (result.records.length > 0) {
            console.log("✅ Neo4j MENTORS edge created successfully (Student -> Mentor)!");
        } else {
            // Check reverse direction
            const result2 = await session.run(
                `MATCH (m:Researcher {userId: $mentorId})-[r:MENTORS]->(s:Researcher {userId: $studentId}) RETURN r`,
                { studentId: parseInt(studentId, 10), mentorId: parseInt(mentorId, 10) }
            );
            if (result2.records.length > 0) {
                console.log("✅ Neo4j MENTORS edge created successfully (Mentor -> Student)!");
            } else {
                console.error("❌ Neo4j edge NOT found!");
            }
        }
        await session.close();
        await driver.close();

        // 4. View a paper & verify dashboard count
        console.log("Testing paper reading history...");
        
        res = await fetch(`${apiUrl}/dashboard/overview`, {
            headers: {'Authorization': `Bearer ${studentToken}`}
        });
        let dashData = await res.json();
        const initialCount = dashData.data?.stats?.papersRead || 0;
        console.log(`Initial papersRead count: ${initialCount}`);

        res = await fetch(`${apiUrl}/users/me/history`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}`},
            body: JSON.stringify({ paper_id: '10.1234/test.paper.uat', action: 'view' })
        });
        const histData = await res.json();

        res = await fetch(`${apiUrl}/dashboard/overview`, {
            headers: {'Authorization': `Bearer ${studentToken}`}
        });
        dashData = await res.json();
        const newCount = dashData.data?.stats?.papersRead || 0;
        console.log(`New papersRead count: ${newCount}`);

        if (newCount > initialCount) {
            console.log("✅ Dashboard count incremented successfully!");
        } else {
            console.error("❌ Dashboard count did not increment.");
        }

    } catch (e) {
        console.error("UAT failed:", e);
    }
}

runUAT();
