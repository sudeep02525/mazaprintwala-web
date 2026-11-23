import '../globals.css';
import { fontDisplay, fontBody } from '@/app/fonts.js';
import QueryProvider from '@/providers/QueryProvider.jsx';
import LayoutClientWrapper from '@/components/common/LayoutClientWrapper.jsx';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing.js';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { serverApi } from '@/lib/server-api.js';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  try {
    const t = await getTranslations({ locale, namespace: 'metadata' });
    const fallbackTitle = t('title');
    const fallbackDescription = t('description');

    const metaRes = await serverApi.get('/cms/key/page_meta', 60).catch(() => null);
    const homeMeta = metaRes?.data?.content?.content?.home || {};

    const title = (
      (locale === 'hi' ? homeMeta.title_hi : locale === 'mr' ? homeMeta.title_mr : null) ||
      homeMeta.title ||
      fallbackTitle
    );

    const description = (
      (locale === 'hi' ? homeMeta.description_hi : locale === 'mr' ? homeMeta.description_mr : null) ||
      homeMeta.description ||
      fallbackDescription
    );

    const keywords = (
      (locale === 'hi' ? homeMeta.keywords_hi : locale === 'mr' ? homeMeta.keywords_mr : null) ||
      homeMeta.keywords ||
      undefined
    );

    const ogImage = homeMeta.ogImage || undefined;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mazaprintwala.com';
    return {
      metadataBase: new URL(baseUrl),
      title: title,
      description: description,
      keywords: keywords ? keywords.split(',').map((s) => s.trim()) : undefined,
      openGraph: {
        title: title,
        description: description,
        url: `${baseUrl}/${locale}`,
        siteName: 'Maza Printwala',
        locale: locale,
        type: 'website',
        images: ogImage ? [{ url: ogImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          'en': `${baseUrl}/en`,
          'hi': `${baseUrl}/hi`,
          'mr': `${baseUrl}/mr`,
          'x-default': `${baseUrl}/en`
        },
      },
    };
  } catch (error) {
    return {
      title: 'Maza Printwala',
    };
  }
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const cookieStore = await cookies();
  const hasConsent = cookieStore.get('cookieConsent')?.value === 'true';
  const theme = cookieStore.get('theme')?.value;
  const isDark = theme === 'dark';

  return (
    <html
      lang={locale}
      className={`${fontDisplay.variable} ${fontBody.variable} ${isDark ? 'dark' : ''}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.theme;var d=t==='dark'||((t==='system'||!t)&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}`,
          }}
        />
        {hasConsent && process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
          `}</Script>
        )}

        {hasConsent && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              ${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ? `gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');` : ''}
            `}</Script>
          </>
        )}
      </head>
      <body className="bg-[var(--bg-page)] text-[var(--text-main)] antialiased font-sans min-h-screen flex flex-col transition-colors" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <LayoutClientWrapper>{children}</LayoutClientWrapper>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
