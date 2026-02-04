import { motion } from 'framer-motion';
import { Paper } from '@mui/material';

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.95
    },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
        }
    }),
    hover: {
        y: -8,
        scale: 1.02,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    },
    tap: {
        scale: 0.98
    }
};

function AnimatedCard({ children, index = 0, sx = {}, ...props }) {
    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
        >
            <Paper
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
                    },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #1976d2, #673ab7, #1976d2)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientFlow 3s ease infinite',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                    },
                    '&:hover::before': {
                        opacity: 1
                    },
                    '@keyframes gradientFlow': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '50%': { backgroundPosition: '100% 50%' },
                        '100%': { backgroundPosition: '0% 50%' }
                    },
                    ...sx
                }}
                {...props}
            >
                {children}
            </Paper>
        </motion.div>
    );
}

export default AnimatedCard;
