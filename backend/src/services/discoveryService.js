const { getSession } = require('../config/neo4j');
const logger = require('../utils/logger');

class DiscoveryService {
    /**
     * Finds researchers who are collaborators of my collaborators but not yet connected to me.
     * Ranks by number of shared connections.
     */
    async getSuggestedCollaborators(userId) {
        const session = getSession();
        try {
            const query = `
                MATCH (me:Researcher {userId: $userId})-[:AUTHORED]->(p1:Paper)<-[:AUTHORED]-(collab:Researcher)-[:AUTHORED]->(p2:Paper)<-[:AUTHORED]-(suggested:Researcher)
                WHERE me <> suggested
                AND NOT (me)-[:AUTHORED]->()<-[:AUTHORED]-(suggested)
                RETURN suggested.userId as userId, 
                       suggested.name as name, 
                       count(DISTINCT collab) as sharedCollabs,
                       collect(DISTINCT collab.name)[0..3] as exampleCollabs
                ORDER BY sharedCollabs DESC
                LIMIT 10
            `;
            
            const result = await session.run(query, { userId: parseInt(userId) });
            
            return result.records.map(record => ({
                userId: record.get('userId').toNumber(),
                name: record.get('name'),
                sharedCollabs: record.get('sharedCollabs').toNumber(),
                exampleCollabs: record.get('exampleCollabs')
            }));

        } catch (error) {
            logger.error(`DiscoveryService Error: ${error.message}`);
            throw error;
        } finally {
            await session.close();
        }
    }
}

module.exports = new DiscoveryService();
