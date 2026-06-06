"use client";

import React, { useState } from 'react';
import { useApi } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MentorshipRequestFormProps {
  mentorId: number;
}

export function MentorshipRequestForm({ mentorId }: MentorshipRequestFormProps) {
  const { fetchWithAuth } = useApi();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetchWithAuth(`${apiUrl}/api/v1/mentorship/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mentor_id: mentorId, message })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to request mentorship');
      }

      setSubmitted(true);
      toast({
        title: "Request Sent",
        description: "Your mentorship request has been sent successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
        Mentorship request submitted successfully. Waiting for response.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Request Mentorship</h3>
        <p className="text-sm text-gray-500 mb-2">Send a message to propose a mentorship arrangement.</p>
        <Textarea
          placeholder="Hi, I'd love to learn more about your research..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send Request
      </Button>
    </form>
  );
}
