import { useState, useEffect } from "react";
import { 
  useGetMe, 
  useGetAdminSummary, 
  useListPrayers, 
  useAdminCreatePrayer, 
  useAdminUpdatePrayer, 
  useAdminDeletePrayer,
  useAdminListPendingWall,
  useAdminModerateWallPost,
  useAdminListDonations,
  useListCategories
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link, Redirect } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Trash2, Edit, CheckCircle, XCircle } from "lucide-react";

function OverviewTab() {
  const { data: summary, isLoading } = useGetAdminSummary();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Doa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totals.prayers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Intensi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totals.wallPosts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totals.donations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dana Terkumpul</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {(summary.totals.raisedAmount / 100).toLocaleString('id-ID')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Doa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.prayerGroupBreakdown.map(item => (
                <div key={item.group} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                  <span className="capitalize">{item.group}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Donasi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentDonations.slice(0, 5).map(donation => (
                <div key={donation.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{donation.donorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true, locale: idLocale })}</p>
                  </div>
                  <span className="font-bold text-sm">Rp {(donation.amount / 100).toLocaleString('id-ID')}</span>
                </div>
              ))}
              {summary.recentDonations.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada donasi.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrayersTab() {
  const { data: prayersData, isLoading, refetch } = useListPrayers({ limit: 100 });
  const { data: categories } = useListCategories();
  const createPrayer = useAdminCreatePrayer();
  const updatePrayer = useAdminUpdatePrayer();
  const deletePrayer = useAdminDeletePrayer();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    body: "",
    group: "daily",
    categoryId: "none",
    author: ""
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      summary: "",
      body: "",
      group: "daily",
      categoryId: "none",
      author: ""
    });
    setEditingId(null);
  };

  const handleEdit = (prayer: any) => {
    setFormData({
      title: prayer.title,
      slug: prayer.slug,
      summary: prayer.summary,
      body: prayer.body,
      group: prayer.group,
      categoryId: prayer.categoryId?.toString() || "none",
      author: prayer.author || ""
    });
    setEditingId(prayer.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus doa ini?")) {
      deletePrayer.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Doa dihapus" });
          refetch();
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      slug: formData.slug,
      summary: formData.summary,
      body: formData.body,
      group: formData.group as any,
      categoryId: formData.categoryId === "none" ? null : parseInt(formData.categoryId),
      author: formData.author || null
    };

    if (editingId) {
      updatePrayer.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Doa diperbarui" });
          setIsDialogOpen(false);
          refetch();
        }
      });
    } else {
      createPrayer.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Doa ditambahkan" });
          setIsDialogOpen(false);
          refetch();
        }
      });
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif">Kelola Pustaka Doa</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>Tambah Doa Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Doa" : "Tambah Doa Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input 
                    value={formData.slug} 
                    onChange={e => setFormData({...formData, slug: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Ringkasan</Label>
                <Textarea 
                  value={formData.summary} 
                  onChange={e => setFormData({...formData, summary: e.target.value})} 
                  required 
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Isi Doa (Markdown)</Label>
                <Textarea 
                  value={formData.body} 
                  onChange={e => setFormData({...formData, body: e.target.value})} 
                  required 
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Grup</Label>
                  <Select value={formData.group} onValueChange={v => setFormData({...formData, group: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="needs">Kebutuhan</SelectItem>
                      <SelectItem value="liturgical">Liturgi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Penulis</Label>
                  <Input 
                    value={formData.author} 
                    onChange={e => setFormData({...formData, author: e.target.value})} 
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Batal</Button>
                </DialogClose>
                <Button type="submit" disabled={createPrayer.isPending || updatePrayer.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Grup</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prayersData?.items.map((prayer) => (
              <TableRow key={prayer.id}>
                <TableCell className="font-medium">{prayer.title}</TableCell>
                <TableCell className="capitalize">{prayer.group}</TableCell>
                <TableCell>{prayer.categoryName || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(prayer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(prayer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {prayersData?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Tidak ada data doa.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function WallModerationTab() {
  const { data: pendingPosts, isLoading, refetch } = useAdminListPendingWall();
  const moderatePost = useAdminModerateWallPost();
  const { toast } = useToast();

  const handleModerate = (id: number, decision: 'approve'|'reject') => {
    moderatePost.mutate({ id, data: { decision } }, {
      onSuccess: () => {
        toast({ title: decision === 'approve' ? "Intensi disetujui" : "Intensi ditolak" });
        refetch();
      }
    });
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif mb-4">Moderasi Dinding Harapan</h3>
      
      {(!pendingPosts || pendingPosts.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Semua intensi telah dimoderasi.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingPosts.map(post => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{post.displayName}</CardTitle>
                    <CardDescription>
                      {format(new Date(post.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })} • Kategori: <span className="uppercase text-xs">{post.category}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleModerate(post.id, 'reject')} disabled={moderatePost.isPending}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Tolak
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleModerate(post.id, 'approve')} disabled={moderatePost.isPending}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Setujui
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="bg-muted p-4 rounded-md font-serif">"{post.message}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DonationsTab() {
  const { data: donations, isLoading } = useAdminListDonations({ limit: 50 });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-100",
    paid: "text-green-600 bg-green-100",
    failed: "text-red-600 bg-red-100",
    refunded: "text-gray-600 bg-gray-100",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif mb-4">Riwayat Donasi</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Donatur</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations?.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>{format(new Date(donation.createdAt), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                <TableCell>
                  <div className="font-medium">{donation.donorName}</div>
                  <div className="text-xs text-muted-foreground">{donation.donorEmail}</div>
                </TableCell>
                <TableCell className="uppercase text-xs">{donation.method}</TableCell>
                <TableCell className="font-medium">Rp {(donation.amount / 100).toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[donation.status] || ""}`}>
                    {donation.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {(!donations || donations.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada donasi.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function Admin() {
  const { data: me, isLoading } = useGetMe();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!me?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-xl text-center">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive font-serif text-2xl">Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Maaf, Anda tidak memiliki akses ke halaman ini.</p>
            <Link href="/">
              <Button>Kembali ke Beranda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Kelola konten dan donasi Lumen.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex mb-8">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="prayers">Pustaka Doa</TabsTrigger>
          <TabsTrigger value="wall">Moderasi Dinding</TabsTrigger>
          <TabsTrigger value="donations">Donasi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="prayers">
          <PrayersTab />
        </TabsContent>
        
        <TabsContent value="wall">
          <WallModerationTab />
        </TabsContent>
        
        <TabsContent value="donations">
          <DonationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
