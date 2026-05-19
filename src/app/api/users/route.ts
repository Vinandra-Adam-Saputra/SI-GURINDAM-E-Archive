import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inisialisasi Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { email, password, name, role } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { name, role },
    email_confirm: true
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const { id, name, role } = await req.json()

  // Update Auth Metadata
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: { name, role }
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Update Profile Table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ name, role })
    .eq('id', id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ message: 'User updated successfully' })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  // Hapus dokumen yang dibuat oleh user ini terlebih dahulu untuk menghindari constraint error
  const { error: docError } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('created_by', id)

  if (docError) return NextResponse.json({ error: 'Database error deleting user documents: ' + docError.message }, { status: 400 })

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'User deleted successfully' })
}
