import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { forwardRef } from 'react';

// Use motion.create() instead of deprecated motion()
const MotionButton = motion.create(Button);

const AnimatedButton = forwardRef(({ children, glowColor = 'rgba(103, 58, 183, 0.5)', sx = {}, ...props }, ref) => {
    return (
        <MotionButton
            ref={ref}
            whileHover={{
                scale: 1.02,
                y: -2
            }}
            whileTap={{
                scale: 0.98
            }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17
            }}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                },
                '&:hover': {
                    boxShadow: `0 10px 30px -10px ${glowColor}`
                },
                '&:hover::before': {
                    opacity: 1
                },
                // Shimmer effect
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s ease'
                },
                '&:hover::after': {
                    left: '100%'
                },
                ...sx
            }}
            {...props}
        >
            {children}
        </MotionButton>
    );
});

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
