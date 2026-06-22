import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yokutxjunethiupgiqrp.supabase.co';
// Fallback para uma chave dummy apenas para evitar quebras no 'next build' caso as variáveis ainda não estejam injetadas
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'dummy-key-to-prevent-build-errors';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
