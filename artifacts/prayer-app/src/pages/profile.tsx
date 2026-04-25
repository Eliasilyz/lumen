import { useGetMe, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme-provider";
import { SignOutButton, RedirectToSignIn, Show } from "@clerk/react";

function ProfileContent() {
  const { data: me, isLoading } = useGetMe();
  const updatePrefs = useUpdatePreferences();
  const { setTheme, setFontScale, theme, fontScale } = useTheme();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!me) return null;

  const handleUpdatePref = (key: string, value: any) => {
    updatePrefs.mutate({ data: { [key]: value } }, {
      onSuccess: () => {
        toast({ title: "Pengaturan disimpan" });
      },
      onError: () => {
        toast({ title: "Gagal menyimpan", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl space-y-8">
      <h1 className="text-3xl md:text-4xl font-serif text-foreground">Profil & Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Nama</Label>
            <p className="font-medium">{me.user.displayName}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{me.user.email || "-"}</p>
          </div>
          <div className="pt-4">
            <SignOutButton>
              <Button variant="outline" className="text-destructive hover:text-destructive">Keluar Akun</Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Preferensi Tampilan</CardTitle>
          <CardDescription>Sesuaikan kenyamanan membaca Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Tema</Label>
            <Select 
              value={theme} 
              onValueChange={(v: any) => {
                setTheme(v);
                handleUpdatePref('theme', v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Terang</SelectItem>
                <SelectItem value="dark">Gelap</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Ukuran Teks Doa</Label>
            <Select 
              value={fontScale} 
              onValueChange={(v: any) => {
                setFontScale(v);
                handleUpdatePref('fontScale', v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Kecil</SelectItem>
                <SelectItem value="md">Normal</SelectItem>
                <SelectItem value="lg">Besar</SelectItem>
                <SelectItem value="xl">Sangat Besar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Bahasa UI</Label>
            <Select 
              value={me.preferences.language} 
              onValueChange={(v: any) => handleUpdatePref('language', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Pengingat Doa</CardTitle>
          <CardDescription>Dapatkan pengingat harian untuk waktu teduh Anda. (Pengiriman aktual memerlukan konfigurasi channel).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Doa Pagi</Label>
              <p className="text-sm text-muted-foreground">Pengingat di pagi hari</p>
            </div>
            <Switch 
              checked={me.preferences.morningReminder}
              onCheckedChange={(v) => handleUpdatePref('morningReminder', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Doa Malam</Label>
              <p className="text-sm text-muted-foreground">Pengingat sebelum istirahat</p>
            </div>
            <Switch 
              checked={me.preferences.eveningReminder}
              onCheckedChange={(v) => handleUpdatePref('eveningReminder', v)}
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <Label>Saluran Pengingat</Label>
            <Select 
              value={me.preferences.reminderChannel} 
              onValueChange={(v: any) => handleUpdatePref('reminderChannel', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak Ada</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Notifikasi Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Profile() {
  return (
    <>
      <Show when="signed-in">
        <ProfileContent />
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}
