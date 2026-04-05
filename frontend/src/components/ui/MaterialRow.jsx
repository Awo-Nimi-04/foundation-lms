function MaterialRow({ material }) {
  const handleDelete = async () => {
    await api.delete(`/materials/${material.id}`);
  };

  return (
    <div className="flex justify-between items-center py-2">
      <p className="text-stone-200">{material.file_name}</p>

      <div className="space-x-3">
        <a href={material.file_url} target="_blank" className="text-blue-400">
          Open
        </a>

        <button onClick={handleDelete} className="text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}
