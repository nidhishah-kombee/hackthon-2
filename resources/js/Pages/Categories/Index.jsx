import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

export default function Index({ categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, put, delete: destroy, errors, reset, clearErrors } = useForm({
        name: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('categories.index'), { search }, { preserveState: true });
    };

    const openModal = (category = null) => {
        clearErrors();
        if (category) {
            setEditingCategory(category);
            setData('name', category.name);
        } else {
            setEditingCategory(null);
            reset('name');
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset('name');
        setEditingCategory(null);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('categories.update', editingCategory.id), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            destroy(route('categories.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Categories</h2>}
        >
            <Head title="Categories" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="flex justify-between items-center mb-6">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <TextInput
                                    type="text"
                                    placeholder="Search categories..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full"
                                />
                                <PrimaryButton type="submit">Search</PrimaryButton>
                            </form>
                            <PrimaryButton onClick={() => openModal()}>Add Category</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {categories.data.map(category => (
                                        <tr key={category.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{category.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{category.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => openModal(category)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">Edit</button>
                                                <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.data.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No categories found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-wrap justify-between items-center sm:px-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {categories.from} to {categories.to} of {categories.total} entries
                            </div>
                            <div className="flex gap-1">
                                {categories.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 border text-sm ${link.active ? 'bg-indigo-50 text-indigo-600 border-indigo-500 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Modal show={showModal} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {editingCategory ? 'Edit Category' : 'Add Category'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <DangerButton onClick={closeModal} className="mr-3">Cancel</DangerButton>
                        <PrimaryButton type="submit">{editingCategory ? 'Update' : 'Create'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
