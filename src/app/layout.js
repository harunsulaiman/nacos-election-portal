import { Inter } from 'next/font/google';
import './styles.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'NACOS Election 2025',
  description: 'Vote for the future of tech leadership with NACOS Nigeria.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}