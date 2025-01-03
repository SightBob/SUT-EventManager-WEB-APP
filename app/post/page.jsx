'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/th';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Card,
  Chip
} from "@nextui-org/react";
import CartEvent from '@/components/CartEvent';
import { Toaster, toast } from 'react-hot-toast';

const Page = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [member, setMember] = useState("no");
    const [isPosting, setIsPosting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location: '',
        description: '',
        image: null,
        additionalLink: '',
        tags: [],
        maxParticipants: '',
        register_start_date: '',
        register_start_time: '',
        register_end_date: '',
        register_end_time: ''
    });

     // สร้าง Custom Upload Adapter
     class CloudinaryUploadAdapter {
        constructor(loader) {
            this.loader = loader;
        }

        async upload() {
            const file = await this.loader.file;
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        default: reader.result
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        abort() {
            // ถ้าจำเป็น สามารถจัดการการยกเลิกการอัปโหลดได้ที่นี่
        }
    }

    function CustomUploadAdapterPlugin(editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new CloudinaryUploadAdapter(loader);
        };
    }

    const editorConfiguration = {
        language: 'th',
        // licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3MzU1MTY3OTksImp0aSI6ImRlNjY5NmIxLTI0MDMtNDA3MC1iZmUwLWRhN2Q4ZTQ1MzkwYSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImMxMDE0ZDEyIn0.4OtXqy8mVfBpYZ85-Qxn3pzAHzuaSg0FJOQ3buiL05vxrhznyGdGNEt0n-5eHgzZFD6ef1nv0GP3cqzz2UftoA',
        toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "imageUpload",
            "undo",
            "redo",
        ],
        extraPlugins: [CustomUploadAdapterPlugin],
        image: {
            upload: {
                types: ['jpeg', 'png', 'gif', 'jpg']
            }
        }
    };

    const handleEditorChange = (event, editor) => {
        const data = editor.getData();
        setFormData(prevState => ({
            ...prevState,
            description: data
        }));
    };

    const hanldeChangeMember = (e) => {
        if (e.target.name === 'type') {
            setMember(e.target.checked ? "yes" : "no");
        }
    }

    const availableTags = ['อาหาร', 'เกม', 'ชมรมนักศึกษา', 'กีฬา', 'การศึกษา', 'ท่องเที่ยว', 'ทุนการศึกษา', 'คอนเสิร์ต'];

    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [activeSection, setActiveSection] = useState('form');
    const [DataByUserid, setDataByUserid] = useState([]);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
    
        if (name === 'image' && files.length > 0) {
            // เก็บไฟล์โดยตรงแทนการแปลงเป็น base64
            setFormData(prevState => ({
                ...prevState,
                image: files[0]  // เก็บไฟล์จริงแทน base64
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleAddTag = (e) => {
        const selectedTag = e.target.value;
        if (selectedTag !== '' && !tags.includes(selectedTag)) {
            setTags([...tags, selectedTag]);
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // เพิ่มฟังก์ชันใหม่สำหรับดึงรูปภาพจาก CKEditor content
    const extractImagesFromContent = (content) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.getElementsByTagName('img');
        return Array.from(images).map(img => img.src);
    };

    // แก้ไขฟังก์ชัน handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsPosting(true);
        const loadingToast = toast.loading('กำลังส่งโพสต์เพื่อรอการอนุมัติ...');
        
        try {
            let imageUrl = null;
            let imagePublicId = null;
            const descriptionImageIds = [];

            // 1. จัดการกับรูภาพใน description
            let updatedDescription = formData.description;
            const contentImages = extractImagesFromContent(formData.description);
            
            for (const imgSrc of contentImages) {
                // ข้ามรูปที่อัพโหลดไป Cloudinary แล้ว
                if (imgSrc.includes('cloudinary.com')) {
                    const publicId = imgSrc.split('/upload/')[1].split('/')[1];
                    if (publicId) {
                        descriptionImageIds.push(publicId);
                    }
                    continue;
                }

                // อัพโหลดรูปที่เป็น base64
                if (imgSrc.startsWith('data:image')) {
                    try {
                        // แปลง base64 เป็น Blob
                        const response = await fetch(imgSrc);
                        const blob = await response.blob();

                        const imageData = new FormData();
                        imageData.append('file', blob);
                        imageData.append('upload_preset', 'events_upload');

                        const uploadResponse = await fetch(
                            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                            {
                                method: 'POST',
                                body: imageData
                            }
                        );

                        const result = await uploadResponse.json();
                        descriptionImageIds.push(result.public_id);
                        updatedDescription = updatedDescription.replace(imgSrc, result.secure_url);
                    } catch (error) {
                        console.error('Error uploading image from description:', error);
                    }
                }
            }

            // 2. อัพโหลดรูปหลักของโพสต์
            if (formData.image) {
                const imageData = new FormData();
                imageData.append('file', formData.image);
                imageData.append('upload_preset', 'events_upload');
            
                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: 'POST',
                        body: imageData
                    }
                );
            
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.secure_url;
                imagePublicId = uploadResult.public_id;
            }

            const postType = activeSection === 'event' ? 'event' : 'info';
            
            const postData = {
                title: formData.title,
                start_date: formData.start_date,
                start_time: formData.start_time,
                end_date: formData.end_date,
                end_time: formData.end_time,
                location: formData.location,
                description: updatedDescription,
                additionalLink: formData.additionalLink,
                picture: imageUrl || '',
                public_id: imagePublicId || '',
                description_image_ids: descriptionImageIds,
                tags,
                uuid: session?.user?.uuid,
                type: postType,
                member: activeSection === 'event' ? "yes" : member,
                maxParticipants: formData.maxParticipants || 0,
                register_start_date: formData.register_start_date,
                register_start_time: formData.register_start_time,
                register_end_date: formData.register_end_date,
                register_end_time: formData.register_end_time
            };

            const res = await axios.post('/api/post/', postData);

            if (res.status === 201) {
                toast.success('ส่งโพสต์เรียบร้อยแล้ว กรุณารอการอนุมัติ', {
                    id: loadingToast,
                });
                // รีเซ็ตฟอร์ม
                setFormData({
                    title: '',
                    start_date: '',
                    start_time: '',
                    end_date: '',
                    end_time: '',
                    location: '',
                    description: '',
                    image: null,
                    additionalLink: '',
                    tags: [],
                    maxParticipants: '',
                    register_start_date: '',
                    register_start_time: '',
                    register_end_date: '',
                    register_end_time: ''
                });
                setTags([]);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('เกิดข้อผิดพลาดในการส่งโพสต์ กรุณาลองใหม่อีกครั้ง', {
                id: loadingToast,
            });
        } finally {
            setIsPosting(false);
        }
    };

    const fetchMyData = async () => {
        try {
            const res = await axios.get("/api/data/userId", { params: { Userid: session.user.uuid } });
            console.log("res.data.getPost: ",res.data.getPost);
            setDataByUserid(res.data.getPost);
        } catch (error) {
            console.log("Error fetch my data: ", error);
        }
    }

    useEffect(() => {
        if (activeSection === "posts" && session?.user?.uuid) {
            fetchMyData();
        }
    }, [activeSection, session?.user?.uuid]);

    const handleDelete = async (postId) => {
        try {
            // อัพเดท state ทันทีเพื่อลบ post จาก UI
            setDataByUserid(prevData => prevData.filter(post => post._id !== postId));
        } catch (error) {
            console.error("Error handling delete:", error);
            // ถ้าเกิดข้อผิดพลาด อาจจะต้อง fetch ข้อมูลใหม่
            fetchMyData();
        }
    };

    // แก้ไขการแสดงผลในส่วน posts
    const renderPostStatus = (status) => {
        switch(status) {
            case 'pending':
                return <Chip color="warning">รอการอนุมัติ</Chip>;
            case 'approved':
                return <Chip color="success">อนุมัติแล้ว</Chip>;
            case 'rejected':
                return <Chip color="danger">ไม่อนุมัติ</Chip>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* เพิ่ม Toaster component */}
            <Toaster 
                position="top-right"
                toastOptions={{
                    // สามารถกำหนด style เพิ่มเติมได้
                    duration: 4000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                    success: {
                        style: {
                            background: 'green',
                        },
                    },
                    error: {
                        style: {
                            background: 'red',
                        },
                    },
                }}
            />
            
            {session?.user?.role ? (
                <div className="container mx-auto">
                    <div className="flex gap-4 mb-6 max-md:grid max-md:grid-cols-2 max-sm:grid-cols-1">
                        <Button
                            className={`${activeSection === 'form' ? 'bg-[#E6AF2E]' : 'bg-[#FADF63]'} text-black`}
                            onClick={() => setActiveSection('form')}
                        >
                            เพิ่มกิจกรรม
                        </Button>
                        <Button
                            className={`${activeSection === 'event' ? 'bg-[#E6AF2E]' : 'bg-[#FADF63]'} text-black`}
                            onClick={() => {
                                setActiveSection('event');
                                setMember('no');
                            }}
                        >
                            เพิ่มโพสต์เปิดรับสมาชิก
                        </Button>
                        <Button
                            className={`${activeSection === 'posts' ? 'bg-[#E6AF2E]' : 'bg-[#FADF63]'} text-black`}
                            onClick={() => setActiveSection('posts')}
                        >
                            โพสต์ของฉัน
                        </Button>
                    </div>

                    {activeSection === 'form' && (
                        <Card className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="หัวเรื่อง"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        variant="bordered"
                                    />
                                    <Input
                                        label="สถานที่ (โปรดระบุอย่างชัดเจน)"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                        variant="bordered"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="วันที่เริ่มงาน"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        variant="bordered"
                                    />
                                    <Input
                                        type="time"
                                        label="เวลาเริ่มงาน"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleInputChange}
                                        variant="bordered"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="วันที่จบงาน"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        variant="bordered"
                                    />
                                    <Input
                                        type="time"
                                        label="เวลาจบงาน"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleInputChange}
                                        variant="bordered"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">
                                        รายละเอียด
                                    </label>
                                    <CKEditor
                                        editor={ClassicEditor}
                                        config={editorConfiguration}
                                        data={formData.description}
                                        onChange={handleEditorChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Select
                                        label="เลือก Tags"
                                        onChange={handleAddTag}
                                        variant="bordered"
                                    >
                                        {availableTags.map((tag) => (
                                            <SelectItem key={tag} value={tag}>
                                                {tag}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                onClose={() => handleRemoveTag(tag)}
                                                variant="flat"
                                            >
                                                {tag}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    type="file"
                                    label="อัปโหลดภาพ"
                                    name="image"
                                    onChange={handleInputChange}
                                    accept="image/*"
                                    variant="bordered"
                                />

                                <Input
                                    type="url"
                                    label="ลิ้งรายละเอียดเพิ่มเติม"
                                    name="additionalLink"
                                    value={formData.additionalLink}
                                    onChange={handleInputChange}
                                    variant="bordered"
                                />

                                <Checkbox
                                    onChange={(e) => setMember(e.target.checked ? "yes" : "no")}
                                >
                                    เปิดรับสมาชิก
                                </Checkbox>

                                {member === "yes" && (
                                    <>
                                    <Input
                                        type="number"
                                        label="จำนวนสมาชิกสูงสุด"
                                        name="maxParticipants"
                                        value={formData.maxParticipants}
                                        onChange={handleInputChange}
                                        min="1"
                                        required
                                        variant="bordered"
                                    />
                                    <div className="mt-6">
                               <h3 className="text-sm mb-4">ระยะเวลาการเปิดรับสมัคร</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <Input
                                       type="date"
                                       label="วันที่เริ่มรับสมัคร"
                                       name="register_start_date"
                                       value={formData.register_start_date}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                                   <Input
                                       type="time"
                                       label="เวลาเริ่มรับสมัคร"
                                       name="register_start_time"
                                       value={formData.register_start_time}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                   <Input
                                       type="date"
                                       label="วันที่ปิดรับสมัคร"
                                       name="register_end_date"
                                       value={formData.register_end_date}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                                   <Input
                                       type="time"
                                       label="เวลาปิดรับสมัคร"
                                       name="register_end_time"
                                       value={formData.register_end_time}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                               </div>
                           </div>

                                    </>
                                )}
                                <br />
                                <Button
                                    color="success"
                                    type="submit"
                                    className="w-full md:w-auto"
                                >
                                    ยืนยัน
                                </Button>
                            </form>
                        </Card>
                    )}

                    {activeSection === 'event' && (
                       <Card className="p-6">
                       <form onSubmit={handleSubmit} className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input
                                   label="หัวเรื่อง"
                                   name="title"
                                   value={formData.title}
                                   onChange={handleInputChange}
                                   required
                                   variant="bordered"
                               />
                               <Input
                                   label="สถานที่ (โปรดระบุอย่างชัดเจน)"
                                   name="location"
                                   value={formData.location}
                                   onChange={handleInputChange}
                                   required
                                   variant="bordered"
                               />
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input
                                   type="date"
                                   label="วันที่เริมงาน"
                                   name="start_date"
                                   value={formData.start_date}
                                   onChange={handleInputChange}
                                   variant="bordered"
                               />
                               <Input
                                   type="time"
                                   label="เวลาเริ่มงาน"
                                   name="start_time"
                                   value={formData.start_time}
                                   onChange={handleInputChange}
                                   variant="bordered"
                               />
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input
                                   type="date"
                                   label="วันที่จบงาน"
                                   name="end_date"
                                   value={formData.end_date}
                                   onChange={handleInputChange}
                                   variant="bordered"
                               />
                               <Input
                                   type="time"
                                   label="เวลาจบงาน"
                                   name="end_time"
                                   value={formData.end_time}
                                   onChange={handleInputChange}
                                   variant="bordered"
                               />
                           </div>

                           <div className="space-y-2">
                               <label className="block text-sm font-medium">
                                   รายละเอียด
                               </label>
                               <CKEditor
                                   editor={ClassicEditor}
                                   config={editorConfiguration}
                                   data={formData.description}
                                   onChange={handleEditorChange}
                               />
                           </div>

                           <div className="space-y-2">
                               <Select
                                   label="เลือก Tags"
                                   onChange={handleAddTag}
                                   variant="bordered"
                               >
                                   {availableTags.map((tag) => (
                                       <SelectItem key={tag} value={tag}>
                                           {tag}
                                       </SelectItem>
                                   ))}
                               </Select>
                               <div className="flex flex-wrap gap-2">
                                   {tags.map((tag, index) => (
                                       <Chip
                                           key={index}
                                           onClose={() => handleRemoveTag(tag)}
                                           variant="flat"
                                       >
                                           {tag}
                                       </Chip>
                                   ))}
                               </div>
                           </div>

                           <Input
                               type="file"
                               label="อัปโหลดภาพ"
                               name="image"
                               onChange={handleInputChange}
                               accept="image/*"
                               variant="bordered"
                           />

                           <Input
                               type="url"
                               label="ลิ้งรายละเอียดเพิ่มเติม"
                               name="additionalLink"
                               value={formData.additionalLink}
                               onChange={handleInputChange}
                               variant="bordered"
                           />

                               <Input
                                   type="number"
                                   label="จำนวนสมาชิกสูงสุด"
                                   name="maxParticipants"
                                   value={formData.maxParticipants}
                                   onChange={handleInputChange}
                                   min="1"
                                   required
                                   variant="bordered"
                               />
                           
                           <div className="mt-6">
                               <h3 className="text-sm mb-4">ระยะเวลาการเปิดรับสมัคร</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <Input
                                       type="date"
                                       label="วันที่เริ่มรับสมัคร"
                                       name="register_start_date"
                                       value={formData.register_start_date}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                                   <Input
                                       type="time"
                                       label="เวลาเริ่มรับสมัคร"
                                       name="register_start_time"
                                       value={formData.register_start_time}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                   <Input
                                       type="date"
                                       label="วันที่ปิดรับสมัคร"
                                       name="register_end_date"
                                       value={formData.register_end_date}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                                   <Input
                                       type="time"
                                       label="เวลาปิดรับสมัคร"
                                       name="register_end_time"
                                       value={formData.register_end_time}
                                       onChange={handleInputChange}
                                       variant="bordered"
                                       required
                                   />
                               </div>
                           </div>
                           
                           <Button
                               color="success"
                               type="submit"
                               className="w-full md:w-auto"
                           >
                               ยืนยัน
                           </Button>
                       </form>
                   </Card>
                    )}

                    {activeSection === 'posts' && (
                        <div className="grid max-[550px]:grid-cols-1 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {DataByUserid.length > 0 ? (
                                DataByUserid.map((item) => (
                                    <div key={item._id}>
                                        <CartEvent 
                                            id={item._id} 
                                            img={item.picture} 
                                            title={item.title} 
                                            start_date={item.start_date} 
                                            start_time={item.start_time} 
                                            location={item.location} 
                                            type="edit" 
                                            member={item.member} 
                                            maxParticipants={item.maxParticipants} 
                                            current_participants={item.current_participants} 
                                            userId={session?.user?.uuid} 
                                            favorites={item.favorites} 
                                            views={item.views}
                                            onDelete={handleDelete}
                                        />
                                        <div className="mt-2">
                                            {renderPostStatus(item.status)}
                                            {item.status === 'rejected' && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    เหตุผล: {item.rejection_reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <Card className="col-span-full p-8 text-center">
                                    <p>ไม่พบโพสต์ของคุณ</p>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <Card className="max-w-md mx-auto p-8 text-center">
                    <Image
                        src="/assets/img_main/profile.png"
                        width={150}
                        height={150}
                        alt="Profile"
                        className="mx-auto rounded-full"
                    />
                    <h2 className="mt-4 text-xl font-semibold">
                        กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้
                    </h2>
                    <Button
                        color="primary"
                        onClick={() => router.push('/login')}
                        className="mt-4"
                    >
                        ไปยังหน้าเข้าสู่ระบบ
                    </Button>
                </Card>
            )}
        </div>
    );
}   

export default Page;