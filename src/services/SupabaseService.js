import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

// Initialize Supabase Client dynamically
export const initSupabase = (url, anonKey) => {
  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }
  try {
    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    supabaseClient = null;
    return null;
  }
};

// Check if Supabase is active and configured
export const isSupabaseConfigured = () => {
  return supabaseClient !== null;
};

// Save a new evaluation
export const saveEvaluation = async (idea, result) => {
  if (!supabaseClient) return null;
  
  try {
    const { data, error } = await supabaseClient
      .from('evaluations')
      .insert([
        { idea, result }
      ])
      .select();
      
    if (error) throw error;
    return data ? data[0] : null;
  } catch (error) {
    console.error("Error saving evaluation to Supabase:", error);
    throw error;
  }
};

// Fetch all past evaluations ordered by timestamp
export const fetchEvaluations = async () => {
  if (!supabaseClient) return [];

  try {
    const { data, error } = await supabaseClient
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map Supabase rows to match the local historyItem schema
    return (data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at).toLocaleString(),
      idea: row.idea,
      result: row.result
    }));
  } catch (error) {
    console.error("Error fetching evaluations from Supabase:", error);
    throw error;
  }
};

// Delete an individual evaluation
export const deleteEvaluation = async (id) => {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting evaluation from Supabase:", error);
    throw error;
  }
};

// Clear the entire evaluations table
export const clearAllEvaluations = async () => {
  if (!supabaseClient) return false;

  try {
    // Delete all rows
    const { error } = await supabaseClient
      .from('evaluations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error clearing evaluations from Supabase:", error);
    throw error;
  }
};
