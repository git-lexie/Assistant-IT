import './globals.css';
import Reg from '@/components/Reg';
export const metadata={title:'Assistant XIE',description:'Offline IT support assistant',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport={themeColor:'#1f2d4d',width:'device-width',initialScale:1};
export default function L({children}){return <html lang="en" suppressHydrationWarning><body><Reg>{children}</Reg></body></html>}
