import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas (JPG, PNG, WEBP, GIF)' }, { status: 400 });
    }

    const fileExt = path.extname(file.name) || '.webp';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    
    let fileUrl = '';

    // 1. Tentar upload para o Supabase Storage se a chave estiver configurada
    const hasSupabaseEnv = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (hasSupabaseEnv) {
      try {
        const { data, error } = await supabase.storage
          .from('loja-media')
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('loja-media')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
        console.log('Upload concluído com sucesso para o Supabase Storage:', fileUrl);
      } catch (supabaseError) {
        console.error('Falha no upload para o Supabase Storage, tentando fallback local:', supabaseError);
      }
    }

    // 2. Se o upload do Supabase não ocorreu ou falhou, usar o fallback local/base64
    if (!fileUrl) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, buffer);
        fileUrl = `/uploads/${fileName}`;
        console.log('Upload concluído com sucesso no disco local (fallback):', fileUrl);
      } catch (writeError) {
        console.warn('Falha ao salvar arquivo no disco local, utilizando fallback Base64:', writeError);
        const base64Data = buffer.toString('base64');
        fileUrl = `data:${file.type};base64,${base64Data}`;
      }
    }

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      name: file.name
    });
  } catch (error) {
    console.error('Erro no upload de arquivo:', error);
    return NextResponse.json({ error: 'Erro ao processar o upload do arquivo' }, { status: 500 });
  }
}
