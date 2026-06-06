"use client";

import React, { useEffect, useState } from 'react';
import { useApi, useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Mentorship {
  id: number;
  mentor_id: number;
  mentee_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  mentor_name: string;
  mentor_avatar?: string;
  mentee_name: string;
  mentee_avatar?: string;
}

export function MentorshipInbox() {
  const { fetchWithAuth } = useApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetchWithAuth(`${apiUrl}/api/v1/mentorship/my`);
        const data = await res.json();
        if (res.ok) {
          setRequests(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch mentorships", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchRequests();
    }
  }, [user, fetchWithAuth]);

  const handleRespond = async (id: number, status: 'accepted' | 'rejected') => {
    setProcessingId(id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetchWithAuth(`${apiUrl}/api/v1/mentorship/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to respond');
      }

      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      toast({
        title: "Success",
        description: `Mentorship request ${status}.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (requests.length === 0) {
    return <div className="text-gray-500 text-center p-8">No mentorship requests found.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mentorships</h2>
      <div className="grid gap-4">
        {requests.map(request => {
          const isIncoming = user?.id.toString() === request.mentor_id.toString();
          const otherUser = isIncoming 
            ? { name: request.mentee_name, role: 'Mentee' }
            : { name: request.mentor_name, role: 'Mentor' };

          return (
            <div key={request.id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-500">{isIncoming ? 'Incoming Request' : 'Outgoing Request'}</span>
                </div>
                <h4 className="font-semibold text-lg">{otherUser.name} <span className="text-sm font-normal text-gray-500">({otherUser.role})</span></h4>
                {request.message && (
                  <p className="text-gray-600 mt-2 text-sm bg-gray-50 p-3 rounded italic">"{request.message}"</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>

              {isIncoming && request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRespond(request.id, 'rejected')}
                    disabled={processingId === request.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleRespond(request.id, 'accepted')}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Accept
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
