import { useState } from "react";
import { useGetTransparency, useCreateDonation } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function Donate() {
  const { data: transparency, isLoading } = useGetTransparency();
  const createDonation = useCreateDonation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("qris");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [donationIntent, setDonationIntent] = useState<any>(null);

  const predefinedAmounts = [50000, 100000, 200000, 500000];

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount.replace(/\D/g, ""));
    
    if (isNaN(parsedAmount) || parsedAmount < 10000) {
      toast({
        title: "Nominal tidak valid",
        description: "Minimal donasi adalah Rp 10.000",
        variant: "destructive"
      });
      return;
    }

    if (!donorName.trim()) {
      toast({
        title: "Nama diperlukan",
        description: "Silakan masukkan nama Anda.",
        variant: "destructive"
      });
      return;
    }

    createDonation.mutate({
      data: {
        amount: parsedAmount,
        currency: "IDR",
        method: method as any,
        donorName,
        donorEmail: donorEmail || null,
        message: message || null,
        isRecurring
      }
    }, {
      onSuccess: (data) => {
        setDonationIntent(data);
      },
      onError: () => {
        toast({
          title: "Terjadi Kesalahan",
          description: "Gagal memproses donasi. Silakan coba lagi.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Dukung Pelayanan Lumen</h1>
        <p className="text-muted-foreground leading-relaxed">
          Lumen hadir sebagai ruang hening digital gratis dan tanpa iklan. Dukungan Anda membantu kami memelihara server, mengembangkan fitur baru, dan menyebarkan devosi ke lebih banyak umat.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
              <CardTitle className="font-serif text-2xl">Beri Donasi</CardTitle>
              <CardDescription>Bantu kami menjaga Lumen tetap gratis untuk semua.</CardDescription>
            </CardHeader>
            
            {donationIntent ? (
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium">Terima kasih atas niat baik Anda!</h3>
                  <div className="bg-secondary p-4 rounded-lg text-left mt-4 whitespace-pre-wrap font-mono text-sm border border-border">
                    {donationIntent.instructions}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => {
                    setDonationIntent(null);
                    setAmount("");
                  }}
                >
                  Beri Donasi Lain
                </Button>
              </CardContent>
            ) : (
              <CardContent className="pt-6">
                <form onSubmit={handleDonate} className="space-y-6">
                  <div className="space-y-3">
                    <Label>Pilih Nominal</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {predefinedAmounts.map(preset => (
                        <Button
                          key={preset}
                          type="button"
                          variant={amount === preset.toString() ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setAmount(preset.toString())}
                        >
                          Rp {(preset).toLocaleString('id-ID')}
                        </Button>
                      ))}
                    </div>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                      <Input
                        type="text"
                        placeholder="Nominal lain..."
                        className="pl-10"
                        value={amount ? parseInt(amount.replace(/\D/g, "") || "0").toLocaleString('id-ID') : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setAmount(val);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="method">Metode Pembayaran</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="va">Virtual Account</SelectItem>
                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                        <SelectItem value="card">Kartu Kredit/Debit</SelectItem>
                        <SelectItem value="manual">Transfer Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="donorName">Nama</Label>
                      <Input 
                        id="donorName" 
                        placeholder="Nama Lengkap atau 'Hamba Allah'" 
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="donorEmail">Email (Opsional)</Label>
                      <Input 
                        id="donorEmail" 
                        type="email" 
                        placeholder="Untuk tanda terima" 
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Pesan / Intensi (Opsional)</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Doa atau harapan Anda..." 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-secondary/50 p-4 rounded-lg border border-border">
                      <div className="space-y-0.5">
                        <Label htmlFor="recurring" className="cursor-pointer">Donasi Bulanan</Label>
                        <p className="text-xs text-muted-foreground">Bantu Lumen setiap bulan</p>
                      </div>
                      <Switch 
                        id="recurring" 
                        checked={isRecurring} 
                        onCheckedChange={setIsRecurring} 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={createDonation.isPending}>
                    {createDonation.isPending ? "Memproses..." : "Lanjutkan Pembayaran"}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-serif">Transparansi Keuangan</CardTitle>
              <CardDescription>Kami percaya pada pengelolaan dana yang terbuka.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-32 w-full mt-6" />
                </div>
              ) : transparency ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-muted-foreground">Terkumpul Bulan Ini</p>
                        <p className="text-2xl font-serif font-medium">
                          Rp {(transparency.raisedAmount / 100).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-sm font-medium">Rp {(transparency.goalAmount / 100).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(100, (transparency.raisedAmount / transparency.goalAmount) * 100)} 
                      className="h-3" 
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      Dari {transparency.donorCount} donatur
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium">Alokasi Dana</h4>
                    <div className="space-y-3">
                      {transparency.allocations.map((alloc, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{alloc.label}</span>
                            <span className="text-muted-foreground">{alloc.percent}%</span>
                          </div>
                          <Progress value={alloc.percent} className="h-1.5 opacity-70" />
                          <p className="text-xs text-muted-foreground">{alloc.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">Data transparansi belum tersedia.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg">Donatur Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : transparency?.recentDonors && transparency.recentDonors.length > 0 ? (
                <div className="space-y-4">
                  {transparency.recentDonors.map((donor, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium">{donor.donorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(donor.createdAt), { addSuffix: true, locale: idLocale })}
                        </p>
                        {donor.message && (
                          <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">"{donor.message}"</p>
                        )}
                      </div>
                      <span className="font-medium text-primary">Rp {(donor.amount / 100).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-2">Belum ada donasi bulan ini.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
