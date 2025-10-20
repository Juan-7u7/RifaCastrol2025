import { createClient } from '@supabase/supabase-js'

// Reemplaza los siguientes valores con los de tu proyecto de Supabase
const supabaseUrl = 'https://tgnmcdnwoakgvviwqzps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbm1jZG53b2FrZ3Z2aXdxenBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTMzNjcsImV4cCI6MjA3NTAyOTM2N30.hla2ihz3YP9X5W8VifzNQGestXgQpJ5mtELJigQn-DM';

export const supabase = createClient(supabaseUrl, supabaseKey);