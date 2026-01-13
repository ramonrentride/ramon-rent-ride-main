import { useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShieldAlert, Ticket, LogIn, Loader2 } from 'lucide-react';
import { useBookingAttempts, useCouponAttempts, useLoginAttempts } from '@/hooks/useRateLimitTelemetry';

export function RateLimitTelemetry() {
  const [clientFilter, setClientFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');

  const { data: bookingAttempts, isLoading: loadingBookings } = useBookingAttempts(debouncedFilter);
  const { data: couponAttempts, isLoading: loadingCoupons } = useCouponAttempts(debouncedFilter);
  const { data: loginAttempts, isLoading: loadingLogins } = useLoginAttempts(debouncedFilter);

  const handleFilterChange = (value: string) => {
    setClientFilter(value);
    // Simple debounce
    setTimeout(() => setDebouncedFilter(value), 300);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'MMM dd, HH:mm:ss');
  };

  const blockedBookings = bookingAttempts?.filter(a => a.was_successful === false) || [];
  const blockedCoupons = couponAttempts?.filter(a => a.was_valid === false) || [];
  const rateLimitedCoupons = couponAttempts?.filter(a => a.code_attempted === '[RATE_LIMITED]') || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Rate Limit Telemetry
          </CardTitle>
          <CardDescription>
            Monitor blocked and rate-limited attempts across booking, coupon, and login systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by client identifier..."
                value={clientFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <Badge variant="destructive">{blockedBookings.length} blocked bookings</Badge>
              <Badge variant="secondary">{rateLimitedCoupons.length} rate-limited coupons</Badge>
            </div>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList>
              <TabsTrigger value="bookings" className="flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                Bookings ({bookingAttempts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" />
                Coupons ({couponAttempts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="logins" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Logins ({loginAttempts?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-4">
              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Attempted At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingAttempts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No booking attempts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookingAttempts?.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-mono text-xs">{attempt.client_identifier}</TableCell>
                          <TableCell>{formatDate(attempt.attempted_at)}</TableCell>
                          <TableCell>
                            {attempt.was_successful ? (
                              <Badge variant="outline" className="text-green-600">Success</Badge>
                            ) : (
                              <Badge variant="destructive">Blocked</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="coupons" className="mt-4">
              {loadingCoupons ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Code Attempted</TableHead>
                      <TableHead>Attempted At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponAttempts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No coupon attempts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      couponAttempts?.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-mono text-xs">{attempt.client_identifier}</TableCell>
                          <TableCell>
                            {attempt.code_attempted === '[RATE_LIMITED]' ? (
                              <Badge variant="destructive">RATE LIMITED</Badge>
                            ) : (
                              <span className="font-mono">{attempt.code_attempted}</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(attempt.attempted_at)}</TableCell>
                          <TableCell>
                            {attempt.was_valid ? (
                              <Badge variant="outline" className="text-green-600">Valid</Badge>
                            ) : (
                              <Badge variant="secondary">Invalid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="logins" className="mt-4">
              {loadingLogins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Username Attempted</TableHead>
                      <TableHead>Attempted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginAttempts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No login attempts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      loginAttempts?.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-mono text-xs">{attempt.client_identifier}</TableCell>
                          <TableCell>{attempt.username_attempted}</TableCell>
                          <TableCell>{formatDate(attempt.attempted_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
