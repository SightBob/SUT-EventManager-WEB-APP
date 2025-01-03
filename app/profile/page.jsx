'use client';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import ProfileDropdown from '@/components/ProfileDropdown'; 
import LoadingSpinner from '@/components/LoadingSpinner';
import CartEvent from '@/components/CartEvent';
import { Button, Input, Card, CardBody, Tabs, Tab, Select, SelectItem, Chip } from "@nextui-org/react";
import Link from 'next/link';

const faculties = {
  "บุคลากร": ["ไม่ระบุ"],
  "สำนักวิชาวิทยาศาสตร์": [
      "สาขาวิชาคณิตศาสตร์",
      "สาขาวิชาเคมี",
      "สาขาวิชาชีววิทยา",
      "สาขาวิชาฟิสิกส์",
      "สาขาวิชาภูมิสารสนเทศ", 
      "สาขาวิชาจุลชีววิทยา",
      "สาขาวิชาวิทยาศาสตร์การแพทย์", 
      "สาขาวิชาวิทยาศาสตร์การกีฬา",
      "สาขาวิชาวิทยาการคอมพิวเตอร์" 
  ],
    "สำนักวิชาเทคโนโลยีสังคม": [
      "นวัตกรรมเทคโนโลยีอุตสาหกรรมบริการ",
      "สาขาวิชาเทคโนโลยีการจัดการ"
    ],
  "สำนักวิชาเทคโนโลยีการเกษตร": [
      "สาขาวิชาเทคโนโลยีการผลิตพืช",
      "สาขาวิชาเทคโนโลยีและนวัตกรรมทางสัตว์", 
      "สาขาวิชาเทคโนโลยีอาหาร"
  ],
    "สำนักวิชาแพทยศาสตร์": [
      "หลักสูตรแพทยศาสตรบัณฑิต"
    ],
   "สำนักวิชาพยาบาลศาสตร์": ["หลักสูตรพยาบาลศาสตรบัณฑิต"],
   "สำนักวิชาวิศวกรรมศาสตร์": [
      "สาขาวิชาวิศวกรรมการผลิต",
      "สาขาวิชาวิศวกรรมเกษตร",
      "สาขาวิชาวิศวกรรมขนส่ง",
      "สาขาวิชาวิศวกรรมคอมพิวเตอร์",
      "สาขาวิชาวิศวกรรมเคมี",
      "สาขาวิชาวิศวกรรมเครื่องกล",
      "สาขาวิชาวิศวกรรมเซรามิก",
      "สาขาวิชาวิศวกรรมโทรคมนาคม",
      "สาขาวิชาวิศวกรรมพอลิเมอร์",
      "สาขาวิชาวิศวกรรมไฟฟ้า",
      "สาขาวิชาวิศวกรรมโยธา",
      "สาขาวิชาวิศวกรรมโลหการ",
      "สาขาวิชาวิศวกรรมสิ่งแวดล้อม",
      "สาขาวิชาวิศวกรรมอุตสาหการ",
      "สาขาวิชาเทคโนโลยีธรณี",
      "สาขาวิชาวิศวกรรมอิเล็กทรอนิกส์",
      "สาขาวิชาวิศวกรรมยานยนต์",     
      "สาขาวิชาวิศวกรรมอากาศยาน",     
      "สาขาวิชาวิศวกรรมปิโ���และเทคโนโลยีธรณี"
  ],
    "สำนักวิชาทันตแพทยศาสตร์": ["หลักสูตรทันตแพทยศาสตรบัณฑิต"],
    "สำนักวิชาสาธารณสุขศาสตร์": [
      "สาขาอนามัยสิ่งแวดล้อม",
      "สาขาอาชีวอนามัยและความปลอดภัย",
      "สาขาโภชนวิทยาและการกำหนดอาหาร" 
    ],
    "สำนักวิชาศาสตร์และศิลป์ดิจิทัล": ["สาขาเทคโนโลยีดิจิทัล", "สาขานิเทศศาสตร์ดิจิทัล"]
  };

const Gender = ["ชาย", "หญิง", "ไม่ระบุ"];

const Interrest = ["เกม", "กีฬา", "อาหาร", "ท่องเที่ยว", "สัตว์เลี้ยง", "การศึกษา", "ชมรมนักศึกษา", 'ทุนการศึกษา', 'คอนเสิร์ต'];

const Page = () => {
  const { data: session, status } = useSession();
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState('ProfileView');
  const [userActivities, setUserActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    gender: '',
    faculty: '',
    major: '',
    username: '',
    profilePicture: '',
    profileCoverPicture: '',
    preferred_categories: []
  });

  useEffect(() => {
    if (status === 'authenticated') {
      async function fetchUserData() {
        try {
          const response = await fetch(`/api/profile?uid=${session.user.uuid}`);
          if (response.ok) {
            const data = await response.json();
            setUser(data);
            setFormData(data); // Initialize form data
          } else {
            console.error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      fetchUserData();
      fetchUserActivity();
    }
  }, [status, session]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const fetchUserActivity = async (userId) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/data/userActivity?uid=${session.user.uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user activities');
      }
  
      const data = await response.json();
      setUserActivities(data.events);
      return data.events;
  
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setFormData((prevData) => {
        
        const updatedCategories = prevData.preferred_categories.includes(interest)
            ? prevData.preferred_categories.filter(item => item !== interest)
            : [...prevData.preferred_categories, interest];
        
        return {
            ...prevData,
            preferred_categories: updatedCategories
        };
    });
};

  const handleFacultyChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      faculty: value,
      major: ''
    }));
  };

  const handleGenderChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      gender: value, 
    }));
  };
  

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // ลบรูปเก่าจาก Cloudinary ถ้ามี public_id
        if (user.profilePicture_public_id) {
          try {
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_id: user.profilePicture_public_id
              }),
            });
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
          }
        }

        // อัพโหลดรูปใหม่
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'events_upload');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        const data = await response.json();
        setFormData(prevState => ({
          ...prevState,
          profilePicture: data.secure_url,
          profilePicture_public_id: data.public_id
        }));
      } catch (error) {
        console.error('Error uploading profile image:', error);
        alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      }
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // ลบรูปเก่าจาก Cloudinary ถ้ามี public_id
        if (user.profileCoverPicture_public_id) {
          try {
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_id: user.profileCoverPicture_public_id
              }),
            });
          } catch (error) {
            console.error('Error deleting old cover picture:', error);
          }
        }

        // อัพโหลดรูปใหม่
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'events_upload');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        const data = await response.json();
        setFormData(prevState => ({
          ...prevState,
          profileCoverPicture: data.secure_url,
          profileCoverPicture_public_id: data.public_id
        }));
      } catch (error) {
        console.error('Error uploading cover image:', error);
        alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      }
    }
  };
  
  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        let updatedFormData = { ...formData };

        // จัดการรูปโปรไฟล์
        if (formData.profilePicture !== user.profilePicture) {
          if (user.profilePicture_public_id) {
            // ลบรูปเก่า
            try {
              await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  public_id: user.profilePicture_public_id
                }),
              });
            } catch (error) {
              console.error('Error deleting old profile picture:', error);
            }
          }
        } else {
          // ถ้าไม่มีการเปลี่ยนรูป ใช้ข้อมูลเดิม
          updatedFormData.profilePicture = user.profilePicture;
          updatedFormData.profilePicture_public_id = user.profilePicture_public_id;
        }

        // จัดการรูปพื้นหลัง
        if (formData.profileCoverPicture !== user.profileCoverPicture) {
          if (user.profileCoverPicture_public_id) {
            // ลบรูปเก่า
            try {
              await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  public_id: user.profileCoverPicture_public_id
                }),
              });
            } catch (error) {
              console.error('Error deleting old cover picture:', error);
            }
          }
        } else {
          // ถ้าไม่มีการเปลี่ยนรูป ใช้ข้อมูลเดิม
          updatedFormData.profileCoverPicture = user.profileCoverPicture;
          updatedFormData.profileCoverPicture_public_id = user.profileCoverPicture_public_id;
        }

        // อัพเดทข้อมูลผู้ใช้
        const response = await fetch(`/api/profile?uid=${session.user.uuid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedFormData),
        });

        if (response.ok) {
          const updatedData = await response.json();
          setUser(updatedData);
          setFormData(updatedData);
          alert('บั���ทึกข้อมูลเสร็จสิ้น');
        } else {
          console.error('Failed to save user data');
          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      } catch (error) {
        console.error('Error saving user data:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    }
    setIsEditing(!isEditing);
  };
  
  if (status === 'loading') {
    return (
      <Card className="flex justify-center items-center w-full h-[80vh] bg-gray-100">
        <CardBody className="grid place-items-center">
          <LoadingSpinner/>
        </CardBody>
      </Card>
    );
  }
   return (
    <div className="flex justify-center items-center w-full min-h-[50vh] bg-gray-100 py-2">
      <Card className="w-full max-w-4xl">
        <CardBody className="p-0">
          {/* Cover Image */}
          <div className="relative w-full h-48">
            <Image
              src={formData.profileCoverPicture || "/assets/img_main/SUT91.jpg"}
              alt="Cover Photo"
              layout="fill"
              className="object-cover rounded-t-lg"
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <label htmlFor="Coverfile-upload" className="cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className='size-8' viewBox="0 0 24 24">
                    <g stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                      <path d="m21.28 6.4-9.54 9.54c-.95.95-3.77 1.39-4.4.76-.63-.63-.2-3.45.75-4.4l9.55-9.55a2.58 2.58 0 1 1 3.64 3.65v0Z"/>
                      <path d="M11 4H6a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h11c2.21 0 3-1.8 3-4v-5"/>
                    </g>
                  </svg>
                </label>
                <input
                  id="Coverfile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
              </div>
            )}
            <Link
                href=""
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-[#ff3300] absolute top-3 right-3 px-6 rounded-full py-2 text-white cursor-pointer"
              >
                <p className="text-lg">ออกจากระบบ</p>
              </Link>
          
          </div>
           {/* Profile Section */}
          <div className="px-6">
            <div className="relative -mt-16 flex items-end gap-4">
              <div className="relative">
                <div className="w-32 h-32 relative">
                  <Image
                    src={formData.profilePicture || "/assets/img_main/usericon.png"}
                    alt="Profile"
                    layout="fill"
                    className="rounded-full object-cover border-4 border-white"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" className='size-8' viewBox="0 0 24 24">
                          <g stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                            <path d="m21.28 6.4-9.54 9.54c-.95.95-3.77 1.39-4.4.76-.63-.63-.2-3.45.75-4.4l9.55-9.55a2.58 2.58 0 1 1 3.64 3.65v0Z"/>
                            <path d="M11 4H6a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h11c2.21 0 3-1.8 3-4v-5"/>
                          </g>
                        </svg>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow pb-2">
                <h2 className="text-xl font-semibold">{`${formData.firstname} ${formData.lastname}`}</h2>
              </div>
              <Button
                color={isEditing ? "success" : "warning"}
                variant="flat"
                onClick={handleEditToggle}
                className="mb-2"
              >
                {isEditing ? 'บันทึก' : 'แก้ไข'}
              </Button>
            </div>
             <Tabs 
              selectedKey={view}
              onSelectionChange={setView}
              className="mt-4"
            >
              <Tab key="ProfileView" title="โปรไฟล์">
                <div className="grid grid-cols-2 gap-4 py-4 max-[510px]:grid-cols-1">
                  <Input
                    label="ชื่อจริง"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange({ target: { name: 'firstname', value: e.target.value } })}
                    isDisabled={!isEditing}
                  />
                  <Input
                    label="นามสกุล"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange({ target: { name: 'lastname', value: e.target.value } })}
                    isDisabled={!isEditing}
                  />
                  <Input
                    label="อีเมล"
                    value={formData.email}
                    onChange={(e) => handleInputChange({ target: { name: 'email', value: e.target.value } })}
                    isDisabled={!isEditing}
                  />
                  <Select 
                    label="เพศ"
                    selectedKeys={[formData.gender]}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    isDisabled={!isEditing}
                  >
                    {Gender.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="คณะ"
                    selectedKeys={[formData.faculty]}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    isDisabled={!isEditing}
                  >
                    {Object.keys(faculties).map((faculty) => (
                      <SelectItem key={faculty} value={faculty}>
                        {faculty}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="สาขา"
                    selectedKeys={[formData.major]}
                    onChange={(e) => handleInputChange({ target: { name: 'major', value: e.target.value } })}
                    isDisabled={!isEditing || !formData.faculty}
                  >
                    {(formData.faculty ? faculties[formData.faculty] : []).map((major) => (
                      <SelectItem key={major} value={major}>
                        {major}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </Tab>
               <Tab key="PersonaView" title="ความเป็นส่วนตัว">
                <div className="py-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">สิ่งที่สนใจ</p>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      Interrest.map((item) => (
                        <Chip
                          key={item}
                          onClick={() => toggleInterest(item)}
                          variant="flat"
                          color={formData.preferred_categories.includes(item) ? "success" : "default"}
                          className="cursor-pointer"
                        >
                          {item}
                        </Chip>
                      ))
                    ) : (
                      formData.preferred_categories.map((item) => (
                        <Chip key={item} variant="flat">
                          {item}
                        </Chip>
                      ))
                    )}
                  </div>
                   <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">กิจกรรมที่เข้าร่วม</p>
                    <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                      {isLoading ? (
                        <Card className="h-[410px]">
                          <CardBody className="flex items-center justify-center">
                            <LoadingSpinner/>
                          </CardBody>
                        </Card>
                      ) : userActivities.length > 0 ? (
                        userActivities.map((item) => (
                          <CartEvent
                            key={item._id}
                            id={item._id}
                            img={item.picture}
                            title={item.title}
                            start_date={item.start_date}
                            start_time={item.start_time}
                            location={item.location}
                            userId={session?.user?.uuid}
                            favorites={item.favorites}
                            views={item.views}
                          />
                        ))
                      ) : (
                        <p>ไม่พบกิจกรรมที่ผู้ใช้เข้าร่วม</p>
                      )}
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Page;