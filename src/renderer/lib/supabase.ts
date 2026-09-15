import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 .env에 없다')
}

// 데스크톱은 OAuth 응답을 fragment(implicit)로 받을 수 없다. 커스텀 스킴 콜백의 ?code=를 쓰는 PKCE로 고정한다.
export const supabase = createClient(url, anonKey, { auth: { flowType: 'pkce' } })
