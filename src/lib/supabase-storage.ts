import { supabase } from './supabase'

export const uploadImageToSupabase = async (file: File, bucket: string = 'featured-tokens'): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}


