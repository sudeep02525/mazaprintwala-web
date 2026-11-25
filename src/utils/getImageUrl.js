export const getImageUrl = (path, transform = 'f_auto,q_auto,w_800,c_limit') => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:')) return trimmed;

  // Cloudinary optimization: automatic modern format (webp/avif), auto compression, responsive max-width
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    if (!trimmed.includes('/f_auto') && !trimmed.includes('/q_auto')) {
      return trimmed.replace('/image/upload/', `/image/upload/${transform}/`);
    }
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  
  // Public static assets hosted directly in Next.js public directory
  if (trimmed.startsWith('/images/')) {
    return trimmed;
  }
  
  // Extract base URL from env
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api\/?$/, '');
  
  // Ensure correct slash formatting
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

export default getImageUrl;
