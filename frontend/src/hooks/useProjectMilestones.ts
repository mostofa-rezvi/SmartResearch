import useSWR from 'swr';
import { useApi } from '@/context/AuthContext';
import { API } from '@/config/api';

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectMilestones(projectId: string | undefined) {
  const { fetchWithAuth } = useApi();

  const fetcher = async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = new Error(data.error?.message || 'Failed to fetch milestones');
      throw error;
    }
    const data = await res.json();
    return data.data as Milestone[];
  };

  const { data: milestones, error, isLoading, mutate } = useSWR<Milestone[]>(
    projectId ? API.projects.listMilestones(projectId) : null,
    fetcher
  );

  const mutateMilestoneStatus = async (
    milestoneId: number,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  ) => {
    if (!milestones) return;

    const currentMilestones = [...milestones];
    const targetMilestone = currentMilestones.find(m => m.id === milestoneId);
    if (!targetMilestone) return;

    // 1. Optimistic Update (instantly update cache locally)
    const updatedMilestones = currentMilestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, status: newStatus };
      }
      return m;
    });

    await mutate(updatedMilestones, false);

    // 2. Perform the server request
    try {
      const res = await fetchWithAuth(API.projects.updateMilestoneStatus(String(milestoneId)), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `Failed to update milestone status: ${res.statusText}`);
      }

      const json = await res.json();
      const updatedMilestone = json.data;

      // Update local cache with server data
      await mutate(
        currentMilestones.map(m => (m.id === milestoneId ? updatedMilestone : m)),
        false
      );
    } catch (err: any) {
      // 3. Rollback cache on error
      await mutate(currentMilestones, false);
      throw err;
    }
  };

  const createMilestone = async (title: string, description: string) => {
    if (!projectId) return;

    const res = await fetchWithAuth(API.projects.createMilestone(projectId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Failed to create milestone');
    }

    const json = await res.json();
    const newMilestone = json.data;

    if (milestones) {
      await mutate([...milestones, newMilestone], false);
    } else {
      await mutate([newMilestone], false);
    }

    return newMilestone;
  };

  return {
    milestones,
    error,
    isLoading,
    mutateMilestoneStatus,
    createMilestone,
    mutate
  };
}
