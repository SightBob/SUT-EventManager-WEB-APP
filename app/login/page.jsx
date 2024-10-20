'use client'

import Image from "next/image"
import Link from "next/link"
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Page = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (session) {
      if (session.user.role === 'user') {
        router.push('/');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setGeneralError('');
  
    try {
      const response = await axios.post('/api/auth/login', { username, password });
  
      if (response.status === 200) {
        const result = await signIn('credentials', {
          redirect: false,
          username,
          password,
        });
        
        if (result.error) {
          setGeneralError(result.error);
        } else {
          if (session.user.role === 'user') {
            router.push('/');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      if (error.response) {
        const { field, message } = error.response.data;
        if (field === 'username') {
          setUsernameError(message);
        } else if (field === 'password') {
          setPasswordError(message);
        } else {
          setGeneralError(message);
        }
      } else if (error.request) {
        setGeneralError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      } else {
        setGeneralError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    }
  };

  return (
    <div className="w-full flex h-[calc(100vh_-_8rem)] ">
      <div className="w-[50%] bg-white flex flex-col items-center justify-center max-md:w-full">
        <h2 className="text-3xl text-center">เข้าสู่ระบบ</h2>
        
        <form onSubmit={handleSubmit} className="max-w-[300px] w-full mx-auto mt-6 flex flex-col">
          <div className="flex justify-between items-end">
          <label htmlFor="username">ชื่อผู้ใช้ หรือ อีเมล</label>
          {usernameError && <p className="text-red-500 mt-2">{usernameError}</p>}
          </div>
          <input
            id="username"
            className="px-3 mt-2 border rounded-md max-w-[300px] py-1 w-full"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username" // Add this line
          />
                  <div className="flex justify-between items-end">
          <label className="mt-5" htmlFor="password">รหัสผ่าน</label>
          {passwordError && <p className="text-red-500 mt-2">{passwordError}</p>}
          </div>
          <input
            id="password"
            className="px-3 border rounded-md max-w-[300px] py-1 w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Link className="self-end text-[#EBB557] text-sm" href="/forgot-password">ลืมรหัสผ่าน?</Link>
          <button className="bg-[#FD8D64] py-2 w-full rounded-md text-white mt-4" type="submit">ล็อคอิน</button>
          <p className="mt-2 self-end">ยังไม่มีบัญชีผู้ใช้ <Link className="text-[#EBB557]" href="register">สมัครสมาชิกที่นี่</Link></p>
        </form>
      </div>
      <div className="w-[50%] bg-[#FFDDD0] h-[calc(100vh_-_8rem)] max-md:hidden">
      <div className="w-auto h-[7rem] relative top-[50%] translate-y-[-50%]"> 
      <Image
        fill
        src="/assets/img_main/logo-full.png"
        style={{ objectFit: 'contain' }} 
        alt="Logo"
        priority
        sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
</div>

      </div>
    </div>
  )
}

export default Page;
