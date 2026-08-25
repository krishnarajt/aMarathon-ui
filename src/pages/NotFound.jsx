import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { House } from 'lucide-react';
import { Page } from '../components/ui/Motion';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <Page className="grid min-h-[60dvh] place-items-center text-center">
      <div>
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="gradient-text font-display text-[6rem] font-extrabold leading-none"
        >
          404
        </motion.p>
        <h1 className="mt-2 text-2xl">Nothing down here</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">
          Wrong turn. The target’s back the other way.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button icon={House}>Take me home</Button>
        </Link>
      </div>
    </Page>
  );
}
