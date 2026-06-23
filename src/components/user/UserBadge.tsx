import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';

interface UserBadgeProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
  };
}

const UserBadge = forwardRef<HTMLDivElement, UserBadgeProps>(({ user }, ref) => {
  const userInfo = {
    id: user.id,
    email: user.email,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    phone: user.phoneNumber || '',
    role: user.role || ''
  };

  const qrCodeData = JSON.stringify(userInfo);

  return (
    <div ref={ref} className="user-badge print:block" style={{ width: '100%', maxWidth: '85mm', margin: '0 auto' }}>
      <div className="badge-container print:border print:border-black print:p-4" style={{ border: '1px solid #000', padding: '16px', borderRadius: '8px' }}>
        <div className="badge-header print:border-b print:border-black print:pb-2 print:mb-3" style={{ borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>BADGE UTILISATEUR</h1>
        </div>
        
        <div className="badge-content print:flex print:flex-row print:justify-between" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="badge-info print:w-3/5" style={{ width: '60%' }}>
            <div className="badge-name">
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{user.firstName} {user.lastName}</h2>
            </div>
            <div className="badge-details">
              <p style={{ fontSize: '12px', margin: '4px 0', lineHeight: '1.2' }}><strong>Email:</strong> {user.email}</p>
              <p style={{ fontSize: '12px', margin: '4px 0', lineHeight: '1.2' }}><strong>Téléphone:</strong> {user.phoneNumber || 'Non spécifié'}</p>
              <p style={{ fontSize: '12px', margin: '4px 0', lineHeight: '1.2' }}><strong>Rôle:</strong> {user.role || 'Utilisateur'}</p>
              <p style={{ fontSize: '12px', margin: '4px 0', lineHeight: '1.2' }}><strong>UID:</strong> {user.id}</p>
            </div>
          </div>
          
          <div className="badge-qr print:w-2/5" style={{ width: '35%' }}>
            <QRCode 
              value={qrCodeData}
              size={100}
              level="M"
              style={{ width: '100%', height: 'auto', maxWidth: '100px', maxHeight: '100px' }}
            />
          </div>
        </div>
        
        <div className="badge-footer print:border-t print:border-black print:pt-2" style={{ borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '10px' }}>
          <p style={{ margin: '2px 0' }}>Ndex36 - Paris Sportifs</p>
          <p style={{ margin: '2px 0' }}>Généré le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
});

UserBadge.displayName = 'UserBadge';

export default UserBadge;