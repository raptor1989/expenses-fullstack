import { Box, Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center'
                }}
            >
                <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
                    404
                </Typography>
                <Typography variant="h4" gutterBottom>
                    Page Not Found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '500px', mb: 4 }}>
                    The page you are looking for doesn't exist or has been moved.
                </Typography>
                <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')} size="large">
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
}
