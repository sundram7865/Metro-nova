import { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageSubmit = async () => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      try {
        const uploadPromises = files.map((file) => storeImage(file));
        const urls = await Promise.all(uploadPromises);
        setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      } catch (err) {
        setImageUploadError('Image upload failed (2 MB max per image)');
      } finally {
        setUploading(false);
      }
    } else {
      setImageUploadError('You can only upload 6 images per listing');
    }
  };

  const storeImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mern-state'); // Replace with your Cloudinary upload preset
    formData.append('cloud_name', 'dxv0d8lce'); // Replace with your Cloudinary cloud name
    
    const response = await axios.post('https://api.cloudinary.com/v1_1/dxv0d8lce/image/upload', formData);
    return response.data.secure_url;
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length < 1) return setError('You must upload at least one image');
    if (+formData.regularPrice < +formData.discountPrice) return setError('Discount price must be lower than regular price');
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) return setError(data.message);
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-col gap-4 flex-1'>
          <input type='text' placeholder='Name' id='name' required onChange={handleChange} value={formData.name} className='border p-3 rounded-lg' />
          <textarea placeholder='Description' id='description' required onChange={handleChange} value={formData.description} className='border p-3 rounded-lg' />
          <input type='text' placeholder='Address' id='address' required onChange={handleChange} value={formData.address} className='border p-3 rounded-lg' />
          <div className='flex gap-6 flex-wrap'>
            <label><input type='checkbox' id='sale' checked={formData.type === 'sale'} onChange={handleChange} /> Sell</label>
            <label><input type='checkbox' id='rent' checked={formData.type === 'rent'} onChange={handleChange} /> Rent</label>
            <label><input type='checkbox' id='parking' checked={formData.parking} onChange={handleChange} /> Parking</label>
            <label><input type='checkbox' id='furnished' checked={formData.furnished} onChange={handleChange} /> Furnished</label>
            <label><input type='checkbox' id='offer' checked={formData.offer} onChange={handleChange} /> Offer</label>
          </div>
        </div>
        <div className='flex flex-col flex-1 gap-4'>
          <p>Images: (Max 6)</p>
          <div className='flex gap-4'>
            <input type='file' multiple onChange={(e) => setFiles(Array.from(e.target.files))} className='p-3 border border-gray-300 rounded w-full' />
            <button type='button' onClick={handleImageSubmit} disabled={uploading} className='p-3 text-green-700 border border-green-700 rounded'>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {imageUploadError && <p className='text-red-700'>{imageUploadError}</p>}
          {formData.imageUrls.map((url, index) => (
            <div key={url} className='flex justify-between p-3 border'>
              <img src={url} alt='listing' className='w-20 h-20 object-cover rounded' />
              <button type='button' onClick={() => handleRemoveImage(index)} className='text-red-700'>Delete</button>
            </div>
          ))}
          <button disabled={loading || uploading} className='p-3 bg-slate-700 text-white rounded'>
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
          {error && <p className='text-red-700'>{error}</p>}
        </div>
      </form>
    </main>
  );
}
