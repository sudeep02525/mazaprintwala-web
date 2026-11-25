'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing.js';
import axiosInstance from '@/services/axiosInstance.js';
import { useAuthStore } from '@/store/authStore.js';
import {
  ArrowLeft, Package, Truck, CreditCard, MapPin, CheckCircle2, Clock,
  FileText, Headphones, AlertCircle,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'ORDER_RECEIVED', label: 'Order placed' },
  { key: 'ARTWORK_REVIEW', label: 'Artwork review' },
  { key: 'ARTWORK_APPROVED', label: 'Artwork approved' },
  { key: 'QUEUED_FOR_PRINTING', label: 'Queued for printing' },
  { key: 'PRINTING', label: 'Printing' },
  { key: 'QUALITY_CHECK', label: 'Quality check' },
  { key: 'READY_FOR_DISPATCH', label: 'Ready to dispatch' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const prettyStatus = (value) =>
  String(value || 'ORDER_RECEIVED').toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const statusColour = (status) => {
  if (status === 'DELIVERED') return 'bg-emerald-100 text-emerald-800';
  if (status === 'DISPATCHED') return 'bg-blue-100 text-blue-800';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=/orders/${orderId}`);
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await axiosInstance.get(`/orders/${orderId}`);
        const found = res?.data?.order || res?.data?.data?.order || res?.order || null;
        if (!cancelled) {
          if (found) setOrder(found);
          else setLoadError('We could not find this order.');
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e?.response?.status === 404
              ? 'This order does not exist, or it belongs to another account.'
              : 'We could not load this order right now. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, orderId, router]);

  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
  const currentStatus = order?.fulfilmentStatus || order?.orderStatus || 'ORDER_RECEIVED';
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen font-sans">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[#0082CA] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All orders
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
          <div className="h-64 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-[var(--text-faint)]" />
          <p className="font-bold text-[var(--text-main)] mb-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 rounded-lg bg-[#0082CA] text-white text-sm font-bold"
          >
            Try again
          </button>
          <div className="mt-4">
            <Link href="/support" className="text-sm font-semibold text-[#0082CA] hover:underline">
              Contact support
            </Link>
          </div>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* header */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-faint)] mb-1">
                  Order
                </p>
                <h1 className="text-2xl font-extrabold text-[var(--text-main)]">{order.orderNumber}</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColour(currentStatus)}`}>
                  {prettyStatus(currentStatus)}
                </span>
                <span className="text-2xl font-black text-[var(--text-main)]">
                  {money(order.finalPayableAmount ?? order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* timeline */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-5">
              Progress
            </h2>
            <ol className="space-y-4">
              {STATUS_STEPS.map((step, index) => {
                const done = currentIndex >= 0 && index <= currentIndex;
                const active = index === currentIndex;
                const entry = [...history].reverse().find((h) => h.newStatus === step.key);
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      done ? 'bg-[#0082CA] text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-faint)] border border-[var(--border)]'
                    }`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${active ? 'text-[#0082CA]' : 'text-[var(--text-main)]'}`}>
                        {step.label}
                      </p>
                      {entry?.timestamp && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(entry.timestamp).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                      {entry?.note && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{entry.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* items */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] px-6 pt-6 pb-3">
              Items
            </h2>
            <div className="divide-y divide-[var(--border)]">
              {(order.items || []).map((item, index) => (
                <div key={index} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-14 h-14 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                    {item.productImageSnapshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImageSnapshot} alt={item.productNameSnapshot || 'Product'} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-main)] truncate">
                      {item.productNameSnapshot || 'Custom print item'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-bold text-[var(--text-main)]">
                    {money((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* address + payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0082CA]" /> Shipping address
              </h2>
              <p className="text-sm font-bold text-[var(--text-main)]">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                {order.shippingAddress?.addressLine1}
                {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pinCode}
              </p>
              {order.contactDetails?.phone && (
                <p className="text-sm text-[var(--text-muted)] mt-2">{order.contactDetails.phone}</p>
              )}
              {order.deliveryMethodSnapshot?.name && (
                <p className="text-xs font-semibold text-[#0082CA] mt-3 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> {order.deliveryMethodSnapshot.name}
                </p>
              )}
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0082CA]" /> Payment
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Status</dt>
                  <dd className="font-bold text-[var(--text-main)]">{prettyStatus(order.paymentStatus)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Method</dt>
                  <dd className="font-bold text-[var(--text-main)]">{prettyStatus(order.paymentMethod)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                  <dt className="text-[var(--text-muted)]">Total paid</dt>
                  <dd className="font-black text-[var(--text-main)]">
                    {money(order.finalPayableAmount ?? order.totalAmount)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* help */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/support"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-bold text-[var(--text-main)] hover:border-[#0082CA]"
            >
              <Headphones className="w-4 h-4 text-[#0082CA]" /> Need help with this order?
            </Link>
            <Link
              href="/products"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0082CA] text-white text-sm font-bold hover:bg-[#006EA8]"
            >
              <FileText className="w-4 h-4" /> Order something else
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
