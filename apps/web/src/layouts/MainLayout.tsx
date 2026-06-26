import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
    Box,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme,
    Container,
    Tooltip,
    alpha
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Receipt as ReceiptIcon,
    Category as CategoryIcon,
    BarChart as BarChartIcon,
    Settings as SettingsIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon,
    AccountCircle,
    Logout,
    PieChart as PieChartIcon,
    MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useThemeMode } from '../theme/ThemeProvider';

const drawerWidth = 248;

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { logout, user } = useAuth();
    const { updateSettings } = useSettings();
    const { mode, toggleColorMode } = useThemeMode();

    const handleToggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        toggleColorMode();
        updateSettings({ theme: newMode }).catch(() => {
            // theme still applies locally even if persisting the preference fails
        });
    };

    const handleDrawerToggle = () => setMobileDrawerOpen(!mobileDrawerOpen);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        navigate('/login');
    };

    // Primary navigation
    const navItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
        { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
        { text: 'Reports', icon: <BarChartIcon />, path: '/reports' }
    ];
    const accountItems = [{ text: 'Settings', icon: <SettingsIcon />, path: '/settings' }];

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const currentTitle =
        [...navItems, ...accountItems].find((item) => isActive(item.path))?.text || 'Expense Manager';

    const renderNavList = (items: typeof navItems) =>
        items.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                    onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileDrawerOpen(false);
                    }}
                    selected={isActive(item.path)}
                    sx={{ py: 0.85 }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 34,
                            color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                            '& svg': { fontSize: 20 }
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText
                        primary={item.text}
                        slotProps={{
                            primary: {
                                sx: {
                                    fontSize: 14,
                                    fontWeight: isActive(item.path) ? 600 : 500,
                                    color: isActive(item.path) ? 'text.primary' : 'text.secondary'
                                }
                            }
                        }}
                    />
                </ListItemButton>
            </ListItem>
        ));

    const sectionLabel = (label: string) => (
        <Typography
            sx={{
                px: 3,
                pt: 2,
                pb: 1,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                opacity: 0.65
            }}
        >
            {label}
        </Typography>
    );

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 2.5,
                    height: 64,
                    flexShrink: 0
                }}
            >
                <Box
                    sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <PieChartIcon sx={{ fontSize: 17, color: '#fff' }} />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    Expense Manager
                </Typography>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {sectionLabel('Menu')}
                <List disablePadding>{renderNavList(navItems)}</List>
                {sectionLabel('Account')}
                <List disablePadding>{renderNavList(accountItems)}</List>
            </Box>

            {/* User footer */}
            <Box sx={{ p: 1, borderTop: '0.5px solid', borderColor: 'divider', flexShrink: 0 }}>
                <ListItemButton
                    onClick={handleMenuOpen}
                    sx={{ borderRadius: 2, py: 1, px: 1.25 }}
                >
                    <Avatar
                        sx={{
                            width: 28,
                            height: 28,
                            mr: 1.25,
                            bgcolor: 'primary.main',
                            fontSize: 13,
                            fontWeight: 600
                        }}
                    >
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            noWrap
                            sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', lineHeight: 1.3 }}
                        >
                            {user?.email?.split('@')[0] || 'User'}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3 }}>
                            {user?.email || ''}
                        </Typography>
                    </Box>
                    <MoreHorizIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                color="default"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: (t) => alpha(t.palette.background.default, 0.8),
                    backdropFilter: 'blur(8px)'
                }}
            >
                <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography sx={{ fontSize: 16, fontWeight: 600, flexGrow: 1, letterSpacing: '-0.01em' }}>
                        {currentTitle}
                    </Typography>

                    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton
                            onClick={handleToggleTheme}
                            sx={{
                                color: 'text.secondary',
                                border: '0.5px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                width: 36,
                                height: 36
                            }}
                        >
                            {mode === 'dark' ? (
                                <Brightness7Icon sx={{ fontSize: 18 }} />
                            ) : (
                                <Brightness4Icon sx={{ fontSize: 18 }} />
                            )}
                        </IconButton>
                    </Tooltip>

                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        keepMounted
                        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        slotProps={{
                            paper: {
                                variant: 'outlined',
                                sx: { mt: -1, minWidth: 180, borderRadius: 2 }
                            }
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                handleMenuClose();
                                navigate('/settings');
                            }}
                        >
                            <ListItemIcon>
                                <AccountCircle fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Profile</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Logout</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileDrawerOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: 'background.default',
                    minHeight: '100vh'
                }}
            >
                <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
}
