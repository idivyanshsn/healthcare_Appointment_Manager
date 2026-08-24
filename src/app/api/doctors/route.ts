import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialisation = searchParams.get('specialisation');
    let doctors = dbStore.getDoctors();
    if (specialisation && specialisation !== 'ALL') {
      doctors = doctors.filter(
        (d) => d.specialisation.toLowerCase() === specialisation.toLowerCase()
      );
    }
    return NextResponse.json({ success: true, doctors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      specialisation,
      experienceYears,
      consultationFee,
      roomNumber,
      bio,
      slotDurationMinutes,
      workingHours,
    } = body;

    if (!name || !email || !specialisation) {
      return NextResponse.json(
        { success: false, error: 'Missing required doctor fields (name, email, specialisation)' },
        { status: 400 }
      );
    }

    const defaultHours = [
      { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
      { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '16:00', isWorkingDay: true },
      { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '14:00', isWorkingDay: false },
      { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '14:00', isWorkingDay: false },
    ];

    const newDoctor = dbStore.createDoctor({
      userId: `usr_${Date.now()}`,
      name,
      email,
      specialisation,
      avatarUrl: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300`,
      experienceYears: Number(experienceYears) || 5,
      consultationFee: Number(consultationFee) || 120,
      rating: 5.0,
      reviewCount: 1,
      roomNumber: roomNumber || 'Suite 101',
      bio: bio || 'Physician at Healthcare Clinic.',
      slotDurationMinutes: Number(slotDurationMinutes) || 30,
      workingHours: workingHours || defaultHours,
      leaveDays: [],
    });

    return NextResponse.json({ success: true, doctor: newDoctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
