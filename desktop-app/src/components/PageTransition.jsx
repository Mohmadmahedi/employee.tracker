import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        y: -20,
        scale: 0.98
    }
};

const pageTransition = {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.4
};

function PageTransition({ children }) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            style={{ width: '100%' }}
        >
            {children}
        </motion.div>
    );
}

export default PageTransition;
