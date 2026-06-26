import { Box, Typography } from '@mui/material';

export interface ChartCardProps {
    title?: string;
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
            {title && (
                <Typography
                    sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'text.secondary',
                        mb: 1.5
                    }}
                >
                    {title}
                </Typography>
            )}
            <Box sx={{ height }}>
                {isEmpty ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
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
