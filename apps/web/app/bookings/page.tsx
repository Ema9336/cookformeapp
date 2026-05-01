'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: string;
  date: string;
  serviceType: string;
  status: string;
  guestCount: number;
  address: string;
  notes?: string;
  allergies?: string;
  totalAmount: number;
  chef: {
    user: {
      name: string;
    };
  };
}

const statusColors: Record<string, string> = {
  PENDING: '#fbbf24',
  ACCEPTED: '#60a5fa',
  COMPLETED: '#34d399',
  CANCELLED: '#ef5350',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function BookingsPage() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredStatus, setFilteredStatus] = useState<string>('ALL');

  useEffect(() => {
    if (authLoading) return;

    const loadBookings = async () => {
      try {
        if (!accessToken) {
          router.push('/');
          return;
        }

        const data = await bookingsApi.myBookings(accessToken);
        setBookings(data as Booking[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [accessToken, authLoading, router]);

  const filtered = filteredStatus === 'ALL' 
    ? bookings 
    : bookings.filter(b => b.status === filteredStatus);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bookings...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>My Bookings</h1>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '2rem',
          borderRadius: '0.5rem',
          textAlign: 'center',
        }}>
          <p>No bookings yet. Browse chefs to make your first booking!</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => setFilteredStatus(status)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: filteredStatus === status ? '#3b82f6' : '#e5e7eb',
                  color: filteredStatus === status ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {status === 'ALL' ? 'All' : statusLabels[status]}
                {' '}
                ({bookings.filter(b => status === 'ALL' || b.status === status).length})
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filtered.map(booking => (
              <div
                key={booking.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>
                      Chef: {booking.chef.user.name}
                    </h3>
                    <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                      Service: {booking.serviceType}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                      Date: {new Date(booking.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: statusColors[booking.status],
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {statusLabels[booking.status]}
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600', fontSize: '1.125rem' }}>
                      ${booking.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Guests: {booking.guestCount}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Address: {booking.address}
                  </p>
                  {booking.notes && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      Notes: {booking.notes}
                    </p>
                  )}
                  {booking.allergies && (
                    <p style={{ margin: '0.25rem 0', color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
                      Allergies: {booking.allergies}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
