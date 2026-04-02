import { Home, Search, Library, Heart, Settings, Music2, Plus } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Search', url: '/search', icon: Search },
  { title: 'Library', url: '/library', icon: Library },
  { title: 'Liked Songs', url: '/liked', icon: Heart },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlists, createPlaylist } = usePlaylist();
  const { resolvedTheme, setTheme } = useTheme();
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setDialogOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Music2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg text-foreground">Muse</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && playlists.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Playlists
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Playlist name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <Button onClick={handleCreate}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {playlists.map(p => (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={`/playlist/${p.id}`} className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                        <Music2 className="mr-2 h-4 w-4" />
                        <span className="truncate">{p.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!collapsed && playlists.length === 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Playlists</SidebarGroupLabel>
            <div className="px-3 py-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> New Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Playlist name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <Button onClick={handleCreate}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
