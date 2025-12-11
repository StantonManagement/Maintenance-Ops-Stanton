import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Home, 
  Plus, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  Camera,
  Calendar,
  Send,
  ChevronRight,
  Wrench,
  Zap,
  Droplets,
  Thermometer,
  LogOut
} from 'lucide-react';
import { useTenantPortal } from '../hooks/useTenantPortal';
import { toast } from 'sonner';

// Mock tenant data
interface TenantRequest {
  id: string;
  category: string;
  description: string;
  status: 'submitted' | 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  scheduled_date?: string;
  technician_name?: string;
  unread_messages: number;
}

const mockRequests: TenantRequest[] = [
  {
    id: 'req-001',
    category: 'Plumbing',
    description: 'Kitchen faucet is leaking',
    status: 'scheduled',
    created_at: '2024-12-01T10:00:00Z',
    scheduled_date: '2024-12-06T09:00:00Z',
    technician_name: 'Ramon Garcia',
    unread_messages: 1
  },
  {
    id: 'req-002',
    category: 'HVAC',
    description: 'Heater not working properly',
    status: 'in_progress',
    created_at: '2024-11-28T14:00:00Z',
    technician_name: 'Kishan Patel',
    unread_messages: 0
  },
  {
    id: 'req-003',
    category: 'Electrical',
    description: 'Outlet in bedroom not working',
    status: 'completed',
    created_at: '2024-11-15T09:00:00Z',
    unread_messages: 0
  }
];

const categories = [
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: '#3B82F6' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: '#F59E0B' },
  { id: 'hvac', label: 'Heating/Cooling', icon: Thermometer, color: '#EF4444' },
  { id: 'appliance', label: 'Appliance', icon: Wrench, color: '#8B5CF6' },
  { id: 'other', label: 'Other', icon: Wrench, color: '#6B7280' }
];

export default function TenantPortal() {
  const { 
    isVerified,
    startVerification, 
    verifyCode, 
    submitRequest: submitPortalRequest,
    fetchMyRequests,
    logout 
  } = useTenantPortal();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'submit' | 'detail'>('home');
  const [selectedRequest, setSelectedRequest] = useState<TenantRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    category: '',
    description: '',
    urgency: 'normal' as 'emergency' | 'urgent' | 'normal',
    permission_to_enter: 'yes' as 'yes' | 'no' | 'call_first'
  });

  // Fetch requests when authenticated
  useEffect(() => {
    if (isVerified) {
      fetchMyRequests();
    }
  }, [isVerified, fetchMyRequests]);

  const handleSendOtp = async () => {
    if (phone.length >= 10) {
      try {
        const result = await startVerification(phone);
        setSessionId(result.sessionId);
        setShowOtp(true);
        toast.success('Verification code sent! (Use 123456 for demo)');
      } catch {
        toast.error('Failed to send verification code');
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!sessionId) return;
    const success = await verifyCode(sessionId, otp);
    if (success) {
      toast.success('Verified successfully!');
    } else {
      toast.error('Invalid verification code');
    }
  };

  const handleLogout = () => {
    logout();
    setPhone('');
    setOtp('');
    setShowOtp(false);
    setSessionId(null);
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.category || !newRequest.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await submitPortalRequest({
      category: newRequest.category,
      description: newRequest.description,
      permissionToEnter: newRequest.permission_to_enter,
      urgency: newRequest.urgency
    });

    if (result) {
      toast.success('Request submitted successfully!');
      setView('home');
      setNewRequest({ category: '', description: '', urgency: 'normal', permission_to_enter: 'yes' });
      fetchMyRequests();
    } else {
      toast.error('Failed to submit request');
    }
  };

  const getStatusBadge = (status: TenantRequest['status']) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary" className="text-xs"><Clock size={12} className="mr-1" />Submitted</Badge>;
      case 'scheduled':
        return <Badge className="text-xs bg-blue-500"><Calendar size={12} className="mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="text-xs bg-amber-500"><Wrench size={12} className="mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="text-xs bg-green-600"><CheckCircle size={12} className="mr-1" />Completed</Badge>;
    }
  };

  // Login Screen
  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F3F4F6' }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#3B82F6' }}>
              <Home size={32} color="white" />
            </div>
            <CardTitle className="text-xl">Tenant Portal</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Submit and track maintenance requests</p>
          </CardHeader>
          <CardContent>
            {!showOtp ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button className="w-full" onClick={handleSendOtp}>
                  Send Verification Code
                </Button>
                <p className="text-xs text-center text-gray-500">
                  We'll send a code to verify your phone number
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" onClick={handleVerifyOtp}>
                  Verify & Continue
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Demo: Enter 123456 to login
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submit Request View
  if (view === 'submit') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView('home')}>
            ← Back
          </Button>
          <h1 className="font-semibold">New Request</h1>
          <div className="w-16" />
        </div>

        <div className="p-4 max-w-lg mx-auto">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">What type of issue?</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      newRequest.category === cat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setNewRequest(prev => ({ ...prev, category: cat.id }))}
                  >
                    <Icon size={24} style={{ color: cat.color }} />
                    <p className="mt-2 text-sm font-medium">{cat.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Describe the issue</label>
            <Textarea
              placeholder="Please describe what's happening..."
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Add Photos (optional)</label>
            <button className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors">
              <Camera size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Tap to add photos</p>
            </button>
          </div>

          {/* Urgency */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">How urgent is this?</label>
            <div className="flex gap-2">
              {[
                { id: 'emergency' as const, label: '🚨 Emergency', desc: 'Flooding, no heat, safety issue' },
                { id: 'normal' as const, label: '📋 Normal', desc: 'Fix when available' },
                { id: 'urgent' as const, label: '📅 Urgent', desc: 'Needs attention soon' }
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                    newRequest.urgency === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setNewRequest(prev => ({ ...prev, urgency: opt.id }))}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permission */}
          <div className="mb-6">
            <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer">
              <input
                type="checkbox"
                checked={newRequest.permission_to_enter === 'yes'}
                onChange={(e) => setNewRequest(prev => ({ ...prev, permission_to_enter: e.target.checked ? 'yes' : 'call_first' }))}
                className="w-5 h-5"
              />
              <div>
                <p className="text-sm font-medium">Permission to enter</p>
                <p className="text-xs text-gray-500">Allow maintenance to enter if I'm not home</p>
              </div>
            </label>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmitRequest}
            disabled={!newRequest.category || !newRequest.description}
          >
            <Send size={18} className="mr-2" />
            Submit Request
          </Button>
        </div>
      </div>
    );
  }

  // Request Detail View
  if (view === 'detail' && selectedRequest) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView('home')}>
            ← Back
          </Button>
          <h1 className="font-semibold">Request Details</h1>
          <div className="w-16" />
        </div>

        <div className="p-4 max-w-lg mx-auto">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold">{selectedRequest.category}</h2>
                  <p className="text-sm text-gray-500">{selectedRequest.description}</p>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.scheduled_date && (
                <div className="p-3 rounded-lg bg-blue-50 mb-3">
                  <p className="text-sm font-medium text-blue-700">
                    <Calendar size={14} className="inline mr-1" />
                    Scheduled: {new Date(selectedRequest.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  {selectedRequest.technician_name && (
                    <p className="text-xs text-blue-600 mt-1">
                      Technician: {selectedRequest.technician_name}
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Submitted: {new Date(selectedRequest.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare size={18} />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Maintenance Team</p>
                  <p className="text-sm">We've scheduled your appointment. Please ensure access to the kitchen area.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="sm" onClick={() => alert('Message sent!')}>
                  <Send size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-semibold">Welcome, Maria</h1>
            <p className="text-xs text-gray-500">Unit 205 • 90 Park St</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Submit Button */}
        <Button 
          className="w-full mb-6" 
          size="lg"
          onClick={() => setView('submit')}
        >
          <Plus size={20} className="mr-2" />
          Submit New Request
        </Button>

        {/* Open Requests */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Open Requests</h2>
          <div className="space-y-3">
            {mockRequests.filter(r => r.status !== 'completed').map(request => (
              <Card 
                key={request.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedRequest(request);
                  setView('detail');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{request.category}</span>
                        {getStatusBadge(request.status)}
                        {request.unread_messages > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5">
                            {request.unread_messages}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{request.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Requests */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Past Requests</h2>
          <div className="space-y-2">
            {mockRequests.filter(r => r.status === 'completed').map(request => (
              <div 
                key={request.id}
                className="p-3 rounded-lg bg-white border flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{request.category}</p>
                  <p className="text-xs text-gray-500">{new Date(request.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className="text-xs bg-green-600">
                  <CheckCircle size={12} className="mr-1" />
                  Completed
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
