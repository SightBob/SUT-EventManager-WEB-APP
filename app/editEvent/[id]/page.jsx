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

import { Toaster, toast } from 'react-hot-toast';

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
        // ถ้าจำเป็น สามารถจดการการยกเลิกการอปโหลดได้ที่นี่
    }
}

const EditEvent = ({ params }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
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
        member: 'no',
        register_start_date: '',
        register_start_time: '',
        register_end_date: '',
        register_end_time: ''
    });

    const availableTags = ['อาหาร', 'เกม', 'ชมรมนักศึกษา', 'กีฬา', 'การศึกษา', 'ท่องเที่ยว', 'ทุนการศึกษา', 'คอนเสิร์ต'];
    const [currentTag, setCurrentTag] = useState('');

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
    };

    const handleEditorChange = (event, editor) => {
        const data = editor.getData();
        setFormData(prev => ({
            ...prev,
            description: data
        }));
    };

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                setIsLoading(true);
                const res = await axios.get(`/api/data/PostId?id=${params.id}`);
                const eventData = res.data.post.getPost;
                
                if (eventData) {
                    if (eventData.status === 'revision') {
                        toast.custom((t) => (
                            <div className="bg-warning-100 border-l-4 border-warning-500 text-warning-700 p-4">
                                <p className="font-bold">โพสต์นี้ถูกส่งกลับมาให้แก้ไข</p>
                                <p>เหตุผล: {eventData.rejection_reason}</p>
                            </div>
                        ), {
                            duration: 10000,
                        });
                    }
                    
                    setFormData({
                        title: eventData.title || '',
                        start_date: eventData.start_date || '',
                        start_time: eventData.start_time || '',
                        end_date: eventData.end_date || '',
                        end_time: eventData.end_time || '',
                        location: eventData.location || '',
                        description: eventData.description || '',
                        image: eventData.picture || null,
                        additionalLink: eventData.link_other || '',
                        tags: eventData.category || [],
                        maxParticipants: eventData.maxParticipants || '',
                        member: eventData.member || 'no',
                        register_start_date: eventData.register_start_date || '',
                        register_start_time: eventData.register_start_time || '',
                        register_end_date: eventData.register_end_date || '',
                        register_end_time: eventData.register_end_time || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching event data:", error);
                toast.error('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchEventData();
        }
    }, [params.id]);

    const handleInputChange = (e) => {
        const { name, value, files, type, checked } = e.target;

        if (name === 'image' && files.length > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prevState => ({
                    ...prevState,
                    image: reader.result 
                }));
            };
            reader.readAsDataURL(files[0]);
        } else if (type === 'checkbox') {
            setFormData(prevState => ({
                ...prevState,
                [name]: checked ? 'yes' : 'no'
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
        if (selectedTag !== '' && !formData.tags.includes(selectedTag)) {
            setFormData(prevState => ({
                ...prevState,
                tags: [...prevState.tags, selectedTag]
            }));
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prevState => ({
            ...prevState,
            tags: prevState.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            // แสดง loading toast
            const loadingToast = toast.loading('กำลังอัพเดทกิจกรรม...');
            
            let imageUrl = formData.image;
            let imagePublicId = formData.public_id;
            const descriptionImageIds = [];

            // 1. จัดการรูปภาพหลัก
            if (formData.image && formData.image.startsWith('data:image')) {
                try {
                    const response = await fetch(formData.image);
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

                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.secure_url;
                    imagePublicId = uploadResult.public_id;
                } catch (error) {
                    console.error('Error uploading main image:', error);
                    toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพหลัก');
                    toast.dismiss(loadingToast);
                    return;
                }
            }

            // 2. จัดการกับรูปภาพใน description
            let updatedDescription = formData.description;
            const contentImages = extractImagesFromContent(formData.description);
            
            for (const imgSrc of contentImages) {
                if (imgSrc.includes('cloudinary.com')) {
                    const urlParts = imgSrc.split('/');
                    const publicIdIndex = urlParts.indexOf('upload') + 1;
                    if (publicIdIndex < urlParts.length) {
                        const publicId = urlParts[publicIdIndex];
                        if (publicId) {
                            descriptionImageIds.push(publicId);
                        }
                    }
                    continue;
                }

                if (imgSrc.startsWith('data:image')) {
                    try {
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
                        console.error('Error uploading description image:', error);
                    }
                }
            }

            // 3. สร้าง object ข้อมูลที่จะอัพเดต ให้ตรงกับ Model
            const updatedData = {
                title: formData.title,
                start_date: formData.start_date,
                start_time: formData.start_time,
                end_date: formData.end_date,
                end_time: formData.end_time,
                location: formData.location,
                description: updatedDescription,
                picture: imageUrl,
                public_id: imagePublicId,
                category: formData.tags,
                link_other: formData.additionalLink,
                member: formData.member,
                maxParticipants: parseInt(formData.maxParticipants) || 0,
                description_image_ids: descriptionImageIds,
                register_start_date: formData.register_start_date,
                register_start_time: formData.register_start_time,
                register_end_date: formData.register_end_date,
                register_end_time: formData.register_end_time,
                status: 'pending',
                rejection_reason: null,
                updated_at: new Date().toISOString()
            };

            // 4. ส่งข้อมูลไปอัพเดต
            const res = await axios.put(`/api/data/PostId?id=${params.id}`, updatedData);
            
            if (res.status === 200) {
                // ปิด loading toast และแสดง success toast
                toast.dismiss(loadingToast);
                toast.success('อัพเดทกิจกรรมสำเร็จ!', {
                    duration: 3000,
                    position: 'top-center',
                    icon: '🎉',
                });
                router.push('/post');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`, {
                duration: 4000,
                position: 'top-center',
            });
        }
    };

    const extractImagesFromContent = (content) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.getElementsByTagName('img');
        return Array.from(images).map(img => img.src);
    };

    if (!session?.user?.role) {
        return (
            <div className="text-center py-10 relative top-0 left-0 right-0 bottom-0 bg-gray-300 min-h-[calc(100vh_-_8rem)] flex justify-center items-center">
                <div className="max-w-[350px] h-[400px] w-full bg-white flex flex-col items-center justify-center rounded-md">
                    <div className="rounded-full overflow-hidden">
                        <Image 
                            src="/assets/img_main/profile.png" 
                            layout="responsive"
                            width={250} 
                            height={250} 
                            alt="Profile picture"
                        />
                    </div>
                    <h2 className='mt-8'>กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้</h2>
                    <button onClick={() => router.push('/login')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                        ไปยังหน้าเข้าสู่ระบบ
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Toaster />
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6 text-center">แก้ไขกิจกรรม</h1>
                <Card className="w-full max-w-2xl mx-auto p-8">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <Input
                                label="หัวเรื่อง"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                isRequired
                            />

                            <Input
                                label="สถานที่"
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="วันที่ (เริ่มงาน)"
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                                <Input
                                    label="เวลา (เริ่มงาน)"
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="วันที่ (จบงาน)"
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                />
                                <Input
                                    label="เวลา (จบงาน)"
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">รายละเอียด</label>
                                <CKEditor
                                    editor={ClassicEditor}
                                    config={editorConfiguration}
                                    data={formData.description}
                                    onChange={handleEditorChange}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            onClose={() => handleRemoveTag(tag)}
                                            variant="flat"
                                        >
                                            {tag}
                                        </Chip>
                                    ))}
                                </div>
                                <Select
                                    label="เลือก Tag"
                                    onChange={handleAddTag}
                                    value={currentTag}
                                >
                                    {availableTags.map((tag) => (
                                        <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <Input
                                type="file"
                                label="อัปโหลดภาพ"
                                name="image"
                                onChange={handleInputChange}
                                accept="image/*"
                            />

                            <Input
                                label="ลิ้งรายละเอียดเพิ่มเติม"
                                type="url"
                                name="additionalLink"
                                value={formData.additionalLink}
                                onChange={handleInputChange}
                                description="แปลงลิ้งเป็นภาพ Qr code ให้ผู้สนใจแสกน"
                            />

                            <Checkbox
                                isSelected={formData.member === "yes"}
                                onChange={(isSelected) => handleInputChange({
                                    target: {
                                        name: "member",
                                        type: "checkbox",
                                        checked: isSelected
                                    }
                                })}
                            >
                                เปิดรับสมาชิก
                            </Checkbox>

                            {formData.member === "yes" && (
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
                                        <h3 className="text-lg font-semibold mb-4">ระยะเวลาการเปิดรับสมัคร</h3>
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

                            <Button
                                color="success"
                                type="submit"
                                className="w-full"
                            >
                                อัพเดทกิจกรรม
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default EditEvent;