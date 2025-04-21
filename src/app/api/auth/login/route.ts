import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { cookies } from 'next/headers';

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  password: string;
  role: string | Role;
  createdAt?: string;
  updatedAt?: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1d' }
    );

    // Devolver tanto el token como los datos del usuario
    const { password: _, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({ 
      token,
      user: userWithoutPassword
    });

    // Establecer la cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 día
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 