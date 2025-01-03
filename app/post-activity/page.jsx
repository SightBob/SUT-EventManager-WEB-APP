"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { toast, Toaster } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const PostActivity = () => {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionType, setActionType] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/getdata');
      setPosts(response.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await axios.put('/api/getdata', {
        id: postId,
        status: 'approved',
        approved_by: session?.user?.uuid
      });
      toast.success('อนุมัติโพสต์เรียบร้อย');
      fetchPosts();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleRejectOrRevision = async () => {
    if (!rejectionReason.trim()) {
      toast.error('กรุณาระบุเหตุผล');
      return;
    }

    if (!actionType) {
      toast.error('กรุณาเลือกประเภทการไม่อนุมัติ');
      return;
    }

    try {
      await axios.put('/api/getdata', {
        id: selectedPostId,
        status: actionType,
        approved_by: session?.user?.uuid,
        rejection_reason: rejectionReason
      });
      
      const message = actionType === 'rejected' ? 'ปฏิเสธโพสต์เรียบร้อย' : 'ส่งกลับไปแก้ไขเรียบร้อย';
      toast.success(message);
      setRejectModalOpen(false);
      setRejectionReason("");
      setActionType("");
      fetchPosts();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`/api/getdata?id=${postId}`);
      toast.success('ลบโพสต์เรียบร้อย');
      setDeleteModalOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบโพสต์');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatus = (status) => {
    switch(status) {
      case 'pending':
        return <Chip color="warning">รอการอนุมัติ</Chip>;
      case 'approved':
        return <Chip color="success">อนุมัติแล้ว</Chip>;
      case 'rejected':
        return <Chip color="danger">ไม่อนุมัติ</Chip>;
      case 'revision':
        return <Chip color="warning" variant="dot">ส่งกลับไปแก้ไข</Chip>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">อนุมัติกิจกรรม</h1>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="ค้นหาตามชื่อกิจกรรมหรือผู้โพสต์"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                {/* <th className="px-4 py-2">ผู้โพสต์</th> */}
                <th className="px-4 py-2">ชื่อกิจกรรม</th>
                <th className="px-4 py-2">วันที่จัด</th>
                <th className="px-4 py-2">สถานที่</th>
                <th className="px-4 py-2">รูปภาพ</th>
                <th className="px-4 py-2">สถานะ</th>
                <th className="px-4 py-2">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post._id} className="border-b">
                  {/* <td className="px-4 py-2">{post.username}</td> */}
                  <td className="px-4 py-2">{post.title}</td>
                  <td className="px-4 py-2">{post.start_date} {post.start_time}</td>
                  <td className="px-4 py-2">{post.location}</td>
                  <td className="px-4 py-2">
                    <img 
                      src={post.picture} 
                      alt={post.title} 
                      className="w-20 h-20 object-cover rounded cursor-pointer"
                      onClick={() => {
                        setSelectedPost(post);
                        setViewModalOpen(true);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    {renderStatus(post.status)}
                    {post.rejection_reason && (
                      <div className="text-sm text-red-500 mt-1">
                        เหตุผล: {post.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          setViewModalOpen(true);
                        }}
                      >
                        ดูรายละเอียด
                      </Button>
                      {post.status === 'pending' && (
                        <>
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => handleApprove(post._id)}
                          >
                            อนุมัติ
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedPostId(post._id);
                              setRejectModalOpen(true);
                            }}
                          >
                            ไม่อนุมัติ
                          </Button>
                        </>
                      )}
                      <Button
                        color="danger"
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          setSelectedPostId(post._id);
                          setDeleteModalOpen(true);
                        }}
                      >
                        ลบ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal 
        isOpen={viewModalOpen} 
        onClose={() => {
          setViewModalOpen(false);
          setSelectedPost(null);
        }}
        size="2xl"
        classNames={{
          base: "!mt-[11rem]",
          body: "max-h-[60vh] overflow-y-auto"
        }}
      >
        <ModalContent>
          {selectedPost && (
            <>
              <ModalHeader className="pb-2">
                <h3 className="text-lg font-semibold">{selectedPost.title}</h3>
              </ModalHeader>
              <ModalBody className="py-2">
                <div className="space-y-2">
                  <div>
                    <img
                      src={selectedPost.picture}
                      alt={selectedPost.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold">ผู้จัดกิจกรรม</h4>
                      <p>{selectedPost.username}</p>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold">สถานที่</h4>
                      <p>{selectedPost.location}</p>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold">วันที่เริ่ม</h4>
                      <p>{selectedPost.start_date} {selectedPost.start_time}</p>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold">วันที่สิ้นสุด</h4>
                      <p>{selectedPost.end_date} {selectedPost.end_time}</p>
                    </div>
                    {selectedPost.member === 'yes' && (
                      <>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold">จำนวนผู้เข้าร่วมสูงสุด</h4>
                          <p>{selectedPost.maxParticipants} คน</p>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold">วันที่เปิดรับสมัคร</h4>
                          <p>{selectedPost.register_start_date} {selectedPost.register_start_time}</p>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold">วันที่ปิดรับสมัคร</h4>
                          <p>{selectedPost.register_end_date} {selectedPost.register_end_time}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-sm space-y-1">
                    <h4 className="font-semibold">รายละเอียดกิจกรรม</h4>
                    <div className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedPost.description }} 
                    />
                  </div>

                  {selectedPost.category && selectedPost.category.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">หมวดหมู่</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPost.category.map((tag, index) => (
                          <Chip key={index} color="warning" variant="flat" size="sm">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="py-2">
                {selectedPost.status === 'pending' && (
                  <>
                    <Button color="success" size="sm" onClick={() => handleApprove(selectedPost._id)}>
                      อนุมัติ
                    </Button>
                    <Button color="danger" size="sm" onClick={() => {
                      setSelectedPostId(selectedPost._id);
                      setViewModalOpen(false);
                      setRejectModalOpen(true);
                    }}>
                      ไม่อนุมัติ
                    </Button>
                  </>
                )}
                <Button color="default" size="sm" onClick={() => {
                  setViewModalOpen(false);
                  setSelectedPost(null);
                }}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={rejectModalOpen} 
        onClose={() => {
          setRejectModalOpen(false);
          setRejectionReason("");
          setActionType("");
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">เลือกการดำเนินการ</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  color="danger" 
                  onClick={() => setActionType('rejected')}
                  className={actionType === 'rejected' ? 'opacity-100' : 'opacity-50'}
                >
                  ไม่อนุมัติ
                </Button>
                <Button 
                  color="warning" 
                  onClick={() => setActionType('revision')}
                  className={actionType === 'revision' ? 'opacity-100' : 'opacity-50'}
                >
                  ส่งกลับไปแก้ไข
                </Button>
              </div>
              <Input
                type="text"
                placeholder={actionType === 'rejected' ? "เหตุผลที่ไม่อนุมัติ" : "ระบุสิ่งที่ต้องการให้แก้ไข"}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={handleRejectOrRevision}>
              ยืนยัน
            </Button>
            <Button
              color="default"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason("");
                setActionType("");
              }}
            >
              ยกเลิก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
          </ModalHeader>
          <ModalBody>
            <p>คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={() => handleDelete(selectedPostId)}>
              ยืนยัน
            </Button>
            <Button
              color="default"
              onClick={() => setDeleteModalOpen(false)}
            >
              ยกเลิก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PostActivity;
