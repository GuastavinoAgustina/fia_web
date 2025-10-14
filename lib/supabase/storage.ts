import { createClient } from './client'

const supabase = createClient()

export async function subirFotoPiloto(file: File, pilotoId: string): Promise<string | null> {
  try {
    // Generar nombre único para la imagen
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `piloto_${pilotoId}_${timestamp}.${extension}`
    
    // Subir archivo al bucket 'fotoCorredor'
    const { data, error } = await supabase.storage
      .from('fotoCorredor')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Error subiendo foto:', error)
      return null
    }
    
    // Obtener URL pública de la imagen
    const { data: publicUrlData } = supabase.storage
      .from('fotoCorredor')
      .getPublicUrl(fileName)
    
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error en subirFotoPiloto:', error)
    return null
  }
}

export async function eliminarFotoPiloto(url: string): Promise<boolean> {
  try {
    // Extraer el nombre del archivo de la URL
    const fileName = url.split('/').pop()
    if (!fileName) return false
    
    const { error } = await supabase.storage
      .from('fotoCorredor')
      .remove([fileName])
    
    if (error) {
      console.error('Error eliminando foto:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error en eliminarFotoPiloto:', error)
    return false
  }
}

export function obtenerUrlFoto(fileName: string): string {
  const { data } = supabase.storage
    .from('fotoCorredor')
    .getPublicUrl(fileName)
  
  return data.publicUrl
}