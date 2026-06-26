import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '5rem', fontWeight: 700, color: 'primary.main', letterSpacing: '-0.05em', lineHeight: 1 }}>
                404
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 600, mt: 1, mb: 1 }}>Page Not Found</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, maxWidth: 400, mb: 4 }}>
                The page you're looking for doesn't exist or has been moved.
            </Typography>
            <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
                Back to Dashboard
            </Button>
        </Box>
    );
}
