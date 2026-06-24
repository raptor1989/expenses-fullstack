import { Box, Typography } from '@mui/material';

export interface ChartCardProps {
    title: string;
    height?: number;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
}

export default function ChartCard({
    title,
    height = 300,
    isEmpty = false,
    emptyMessage = 'No data available',
    children
}: ChartCardProps) {
    return (
        <Box>
            <Typography variant="subtitle1" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ height }}>
                {isEmpty ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body1" color="textSecondary">
                            {emptyMessage}
                        </Typography>
                    </Box>
                ) : (
                    children
                )}
            </Box>
        </Box>
    );
}
