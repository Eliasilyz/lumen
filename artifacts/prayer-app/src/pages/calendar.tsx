import { useState } from "react";
import { useGetMonth, useGetToday } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Link } from "wouter";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: monthData, isLoading } = useGetMonth({ year, month });
  const { data: todayData } = useGetToday();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const selectedDayData = monthData?.find(d => isSameDay(new Date(d.date), selectedDate)) || todayData;

  const seasonColors: Record<string, string> = {
    violet: "bg-purple-600",
    white: "bg-white border-gray-200 border",
    red: "bg-red-600",
    green: "bg-green-600",
    rose: "bg-pink-400",
    black: "bg-black"
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Kalender Liturgi</h1>
          <p className="text-muted-foreground mt-2">Ikuti perjalanan tahun gereja.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday} className="mr-2">Hari Ini</Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-40 text-center font-medium">
            {format(currentDate, "MMMM yyyy", { locale: idLocale })}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  
                  {daysInMonth.map(day => {
                    const dayData = monthData?.find(d => isSameDay(new Date(d.date), day));
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square rounded-md flex flex-col items-center justify-center relative transition-all
                          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-secondary'}
                          ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                        `}
                      >
                        <span className={`text-lg ${isToday ? 'font-bold text-primary' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayData && (
                          <div className={`w-2 h-2 rounded-full mt-1 ${seasonColors[dayData.color] || "bg-primary"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full mt-4" />
                </div>
              ) : selectedDayData ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${seasonColors[selectedDayData.color] || "bg-primary"}`} />
                      <span className="font-medium">{selectedDayData.title}</span>
                    </div>
                    {selectedDayData.isFeast && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium ml-5">Pesta / Hari Raya</span>
                    )}
                    {selectedDayData.saint && (
                      <p className="text-sm text-muted-foreground mt-2 ml-5">
                        Peringatan: {selectedDayData.saint}
                      </p>
                    )}
                  </div>

                  {selectedDayData.reflection && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Renungan</h4>
                      <p className="font-serif italic leading-relaxed text-foreground">
                        "{selectedDayData.reflection}"
                      </p>
                    </div>
                  )}

                  {selectedDayData.recommendedPrayerSlug && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Doa yang Disarankan</h4>
                      <Link href={`/prayer/${selectedDayData.recommendedPrayerSlug}`}>
                        <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                          <div className="flex flex-col">
                            <span className="font-serif text-base">{selectedDayData.recommendedPrayerTitle}</span>
                          </div>
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tidak ada data liturgi untuk hari ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
