import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllProfiles, useToggleCoreMember, useToggleAdmin } from '@/hooks/useProfiles';
import Navigation from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Loader2, Shield, Search, UserX, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProfileWithPhotos } from '@/types/database.types';

export default function AdminMembers() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profiles, isLoading } = useAllProfiles();
  const { toast } = useToast();

  const isSuperAdmin = !!profile?.is_super_admin;

  // Access control guard
  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/');
    }
  }, [authLoading, profile, navigate]);

  // Stats for header
  const totalMembers = profiles?.length ?? 0;
  const adminCount = profiles?.filter(p => p.is_admin).length ?? 0;
  const superAdminCount = profiles?.filter(p => p.is_super_admin).length ?? 0;
  const coreCount = profiles?.filter(p => p.is_core_member).length ?? 0;

  // Search/filter
  const [search, setSearch] = useState('');

  const filteredProfiles = useMemo(
    () =>
      (profiles || []).filter((p) => {
        const q = search.toLowerCase();
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.instagram_handle?.toLowerCase().includes(q)
        );
      }),
    [profiles, search]
  );

  // Mutations
  const toggleCoreMember = useToggleCoreMember();
  const toggleAdmin = useToggleAdmin();

  // Core member toggle (available to any admin)
  function handleToggleCoreMember(userId: string, current: boolean) {
    toggleCoreMember.mutate(
      { userId, isCoreMember: !current },
      {
        onError(error) {
          toast({
            title: 'Error updating core member status',
            description: error.message ?? 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  }

  // Admin toggle with confirmation
  const [pendingAdminTarget, setPendingAdminTarget] = useState<ProfileWithPhotos | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  function openAdminDialog(p: ProfileWithPhotos) {
    setPendingAdminTarget(p);
    setAdminDialogOpen(true);
  }

  async function confirmToggleAdmin() {
    if (!pendingAdminTarget) return;
    const makeAdmin = !pendingAdminTarget.is_admin;

    try {
      await toggleAdmin.mutateAsync({
        userId: pendingAdminTarget.id,
        isAdmin: makeAdmin,
      });

      toast({
        title: makeAdmin ? 'Admin granted' : 'Admin revoked',
        description: `${pendingAdminTarget.full_name || pendingAdminTarget.email} ${
          makeAdmin ? 'now has' : 'no longer has'
        } admin access.`,
      });
      setAdminDialogOpen(false);
      setPendingAdminTarget(null);
    } catch (error: any) {
      toast({
        title: 'Error updating admin access',
        description: error.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back link */}
            <Link
              to="/admin"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold font-heading">Manage Members</h1>
                <p className="text-muted-foreground">
                  View all members, core status, and admin roles.
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0 flex-wrap">
                <Badge variant="secondary">Total: {totalMembers}</Badge>
                <Badge variant="secondary">Admins: {adminCount}</Badge>
                <Badge variant="secondary">Super: {superAdminCount}</Badge>
                <Badge variant="secondary">Core: {coreCount}</Badge>
              </div>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or Instagram..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Member Directory
                </CardTitle>
                <CardDescription>
                  Super admins can manage admin access; all admins can set core members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No members match your search.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Core</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Super</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProfiles.map((p) => {
                          const isSelf = p.id === profile?.id;
                          const canManageAdmin = isSuperAdmin && !isSelf;

                          return (
                            <TableRow key={p.id}>
                              <TableCell className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {p.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {p.full_name || 'Unnamed'}
                                  </div>
                                  {p.instagram_handle && (
                                    <div className="text-xs text-muted-foreground">
                                      @{p.instagram_handle}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{p.email}</TableCell>
                              <TableCell className="text-sm">
                                {p.role || <span className="text-muted-foreground">Member</span>}
                              </TableCell>
                              {/* Core member toggle: all admins */}
                              <TableCell>
                                <Switch
                                  checked={p.is_core_member}
                                  onCheckedChange={() =>
                                    handleToggleCoreMember(p.id, !!p.is_core_member)
                                  }
                                />
                              </TableCell>
                              {/* Admin column: toggle only for super admins */}
                              <TableCell>
                                {canManageAdmin ? (
                                  <Button
                                    variant={p.is_admin ? 'outline' : 'secondary'}
                                    size="sm"
                                    onClick={() => openAdminDialog(p)}
                                    disabled={toggleAdmin.isPending}
                                  >
                                    {p.is_admin ? (
                                      <>
                                        <UserX className="mr-1 h-4 w-4" />
                                        Remove
                                      </>
                                    ) : (
                                      <>
                                        <UserPlus className="mr-1 h-4 w-4" />
                                        Make Admin
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Badge variant={p.is_admin ? 'default' : 'outline'}>
                                    {p.is_admin ? 'Admin' : 'Member'}
                                  </Badge>
                                )}
                              </TableCell>
                              {/* Super admin tag: always read-only */}
                              <TableCell>
                                {p.is_super_admin && (
                                  <Badge variant="destructive">Super</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Confirmation dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAdminTarget?.is_admin
                ? 'Revoke admin access?'
                : 'Grant admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAdminTarget && (
                <>
                  You are about to{' '}
                  <strong>
                    {pendingAdminTarget.is_admin ? 'remove' : 'grant'}
                  </strong>{' '}
                  admin access for{' '}
                  <span className="font-medium">
                    {pendingAdminTarget.full_name || pendingAdminTarget.email}
                  </span>
                  . This controls access to the admin dashboard.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel disabled={toggleAdmin.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAdmin}
              disabled={toggleAdmin.isPending}
            >
              {toggleAdmin.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
