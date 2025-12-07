import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <html>
      <body className={styles.body}>
        <div className={styles.container}>
          <h1 className={styles.title}>404</h1>
          <p className={styles.message}>
            Página não encontrada
          </p>
          <Link href="/" className={styles.link}>
            Voltar para Home
          </Link>
        </div>
      </body>
    </html>
  );
}
