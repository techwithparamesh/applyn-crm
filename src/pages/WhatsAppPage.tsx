import { useWhatsAppAccount } from '@/hooks/useWhatsApp';
import { WhatsAppConnectScreen } from '@/components/whatsapp/WhatsAppConnectScreen';
import { WhatsAppInbox } from '@/components/whatsapp/WhatsAppInbox';
import { Skeleton } from '@/components/ui/skeleton';

export default function WhatsAppPage() {
  const { account, loading, connectAccount } = useWhatsAppAccount();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!account || !account.is_connected) {
    return <WhatsAppConnectScreen onConnect={connectAccount} />;
  }

  return <WhatsAppInbox account={account} />;
}
