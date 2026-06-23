import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type ApplicationStatus = 'candidat' | 'en-instruction' | 'en-formation' | 'en-service' | 'rejete' | 'suspendu';

export interface AgentApplication {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  dateOfBirth: Date;
  idNumber: string;
  status: ApplicationStatus;
  experience?: string;
  motivation?: string;
  documents?: {
    cv?: string;
    idCard?: string;
    photo?: string;
  };
  statusHistory: StatusChange[];
  createdBy?: string;
  assignedTo?: string;
  agentId?: string;
  notes?: string;
  serviceInfo?: {
    serviceNumber?: string;
    personalPhone?: string;
    agentId?: string;
    tpeNumber?: string;
    callBoxNumber?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StatusChange {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  changedBy: string;
  changedByName: string;
  reason?: string;
  date: Date;
}

export const applicationStatuses = [
  { value: 'candidat', label: 'Candidat', color: 'blue', icon: 'FileText' },
  { value: 'en-instruction', label: 'En instruction', color: 'yellow', icon: 'Search' },
  { value: 'en-formation', label: 'En formation', color: 'purple', icon: 'BookOpen' },
  { value: 'en-service', label: 'En service', color: 'green', icon: 'CheckCircle' },
  { value: 'rejete', label: 'Rejeté', color: 'red', icon: 'XCircle' },
  { value: 'suspendu', label: 'Suspendu', color: 'gray', icon: 'PauseCircle' }
];

export class AgentApplicationService {
  private static applicationsCollection = collection(db, 'agent_applications');

  static async createApplication(application: Omit<AgentApplication, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const initialStatusChange: StatusChange = {
      from: null,
      to: 'candidat',
      changedBy: application.createdBy || 'system',
      changedByName: 'Système',
      reason: 'Création de la candidature',
      date: new Date()
    };

    const applicationData = {
      ...application,
      status: 'candidat',
      statusHistory: [
        {
          ...initialStatusChange,
          date: Timestamp.fromDate(initialStatusChange.date)
        }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(this.applicationsCollection, applicationData);
    return docRef.id;
  }

  static async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    changedBy: string,
    changedByName: string,
    reason?: string
  ): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    const applicationDoc = await getDoc(applicationRef);

    if (!applicationDoc.exists()) {
      throw new Error('Candidature introuvable');
    }

    const currentData = applicationDoc.data();
    const currentStatus = currentData.status;

    const statusChange: StatusChange = {
      from: currentStatus,
      to: newStatus,
      changedBy,
      changedByName,
      reason,
      date: new Date()
    };

    const updatedHistory = [
      ...(currentData.statusHistory || []),
      {
        ...statusChange,
        date: Timestamp.fromDate(statusChange.date)
      }
    ];

    await updateDoc(applicationRef, {
      status: newStatus,
      statusHistory: updatedHistory,
      updatedAt: Timestamp.now()
    });
  }

  static async updateApplication(
    applicationId: string,
    updates: Partial<AgentApplication>
  ): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    await updateDoc(applicationRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async linkToAgent(applicationId: string, agentId: string): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    await updateDoc(applicationRef, {
      agentId,
      updatedAt: Timestamp.now()
    });
  }

  static async getApplicationById(applicationId: string): Promise<AgentApplication | null> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    const applicationDoc = await getDoc(applicationRef);

    if (!applicationDoc.exists()) {
      return null;
    }

    const data = applicationDoc.data();
    return this.mapDocumentToApplication(applicationDoc.id, data);
  }

  static async getAllApplications(): Promise<AgentApplication[]> {
    const q = query(
      this.applicationsCollection,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return this.mapDocumentToApplication(doc.id, data);
    });
  }

  static async getApplicationsByStatus(status: ApplicationStatus): Promise<AgentApplication[]> {
    const q = query(
      this.applicationsCollection,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return this.mapDocumentToApplication(doc.id, data);
    });
  }

  static async getApplicationsByAssignee(assignedTo: string): Promise<AgentApplication[]> {
    const q = query(
      this.applicationsCollection,
      where('assignedTo', '==', assignedTo),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return this.mapDocumentToApplication(doc.id, data);
    });
  }

  static async assignApplication(
    applicationId: string,
    assignedTo: string
  ): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    await updateDoc(applicationRef, {
      assignedTo,
      updatedAt: Timestamp.now()
    });
  }

  static async addNote(
    applicationId: string,
    note: string
  ): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    await updateDoc(applicationRef, {
      notes: note,
      updatedAt: Timestamp.now()
    });
  }

  static async updateServiceInfo(
    applicationId: string,
    serviceInfo: {
      serviceNumber: string;
      personalPhone: string;
      agentId: string;
      tpeNumber: string;
      callBoxNumber: string;
    }
  ): Promise<void> {
    const applicationRef = doc(db, 'agent_applications', applicationId);
    await updateDoc(applicationRef, {
      serviceInfo,
      updatedAt: Timestamp.now()
    });
  }

  static hasRequiredServiceInfo(application: AgentApplication): boolean {
    const info = application.serviceInfo;
    return !!(
      info?.serviceNumber &&
      info?.personalPhone &&
      info?.agentId &&
      info?.tpeNumber &&
      info?.callBoxNumber
    );
  }

  private static mapDocumentToApplication(id: string, data: any): AgentApplication {
    return {
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      dateOfBirth: data.dateOfBirth?.toDate(),
      idNumber: data.idNumber,
      status: data.status,
      experience: data.experience,
      motivation: data.motivation,
      documents: data.documents,
      statusHistory: (data.statusHistory || []).map((change: any) => ({
        from: change.from,
        to: change.to,
        changedBy: change.changedBy,
        changedByName: change.changedByName,
        reason: change.reason,
        date: change.date?.toDate()
      })),
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      agentId: data.agentId,
      notes: data.notes,
      serviceInfo: data.serviceInfo,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  }

  static getStatusInfo(status: ApplicationStatus) {
    return applicationStatuses.find(s => s.value === status) || applicationStatuses[0];
  }

  static canTransitionTo(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean {
    const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      'candidat': ['en-instruction', 'rejete'],
      'en-instruction': ['en-formation', 'rejete', 'candidat'],
      'en-formation': ['en-service', 'rejete', 'en-instruction'],
      'en-service': ['suspendu'],
      'rejete': [],
      'suspendu': ['en-service']
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  static getNextPossibleStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
    const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      'candidat': ['en-instruction', 'rejete'],
      'en-instruction': ['en-formation', 'rejete', 'candidat'],
      'en-formation': ['en-service', 'rejete', 'en-instruction'],
      'en-service': ['suspendu'],
      'rejete': [],
      'suspendu': ['en-service']
    };

    return transitions[currentStatus] || [];
  }
}
