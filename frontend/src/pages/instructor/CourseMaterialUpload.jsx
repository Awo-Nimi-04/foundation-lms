import { useEffect, useState } from "react";
import api from "../../api/api";
import { useCourse } from "../../context/CourseContext";
import Button from "../../components/ui/Button";
import { useLoading } from "../../context/LoadingContext";

export default function CourseMaterialUpload() {
  const { currentCourse } = useCourse();
  const { showLoading, hideLoading } = useLoading();
  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [uncategorized, setUncategorized] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState();

  useEffect(() => {
    if (!currentCourse) return;
    fetchMaterials();
  }, [currentCourse]);

  const fetchMaterials = async () => {
    showLoading("Updating . . .");
    try {
      const res = await api.get(`/courses/${currentCourse.id}/files`);
      setFolders(res.data.folders);
      setUncategorized(res.data.uncategorized);
      hideLoading();
    } catch (err) {
      console.error(err);
      hideLoading();
    } finally {
      hideLoading();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    showLoading("Creating Folder . . .");
    try {
      const res = await api.post(
        `/courses/${currentCourse.id}/folder`,
        {
          name: newFolderName,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setFolders((prev) => [...prev, { ...res.data, materials: [] }]);
      setNewFolderName("");
      await fetchMaterials();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleDeleteFolder = async (folderId) => {
    showLoading("Deleting Folder . . .");
    try {
      await api.delete(`/courses/folders/${folderId}`);
      await fetchMaterials();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // optional folder support
    if (selectedFolderId) {
      formData.append("folder_id", selectedFolderId);
    }
    showLoading("Uplpading File . . .");
    try {
      const res = await api.post(
        `/courses/${currentCourse.id}/upload_material`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      //   setMaterials((prev) => [...prev, res.data]);
      setFile(null);
      setSelectedFolderId(null);
      await fetchMaterials();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleFolderUpload = (e, folderId) => {
    setFile(e.target.files[0]);
    setSelectedFolderId(folderId);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Materials list */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-stone-200">Folders</h2>
        {folders.length === 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-stone-300">No folders</p>
          </div>
        )}
        {folders.length > 0 &&
          folders.map((folder) => (
            <div key={folder.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-stone-200 font-bold">📁 {folder.name}</h3>
                {folder.id !== selectedFolderId && (
                  <div className="flex space-x-2 items-center">
                    <div className="flex flex-col space-y-1">
                      <label className="inline-block">
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-500 transition">
                          Upload to Folder
                        </span>

                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFolderUpload(e, folder.id)}
                        />
                      </label>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleDeleteFolder(folder.id);
                      }}
                      className="text-red-500 cursor-pointer"
                    >
                      Delete Folder
                    </Button>
                  </div>
                )}
                {folder.id === selectedFolderId && (
                  <div className="flex space-x-2 items-center">
                    <p className="text-sky-400 font-medium w-40 line-clamp-1">
                      {file.name}
                    </p>
                    <Button variant="secondary" onClick={handleUpload}>
                      Upload File
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={() => {
                        setFile(null);
                        setSelectedFolderId(null);
                      }}
                      className="text-red-500 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              {folder.materials.map((m) => (
                <MaterialRow key={m.id} material={m} refresh={fetchMaterials} />
              ))}
            </div>
          ))}
        <div className="bg-gray-700 p-4 rounded-lg space-y-3">
          <h3 className="text-stone-200 font-semibold">Create Folder</h3>

          <div className="flex space-x-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Lesson 1 Files"
              className="flex-1 p-2 rounded bg-gray-800 text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 bg-green-600 rounded text-white"
            >
              Create
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-stone-200">Other Files</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          {uncategorized.length === 0 && (
            <p className="text-stone-300">No files</p>
          )}
          {uncategorized.length > 0 &&
            uncategorized.map((m) => (
              <MaterialRow key={m.id} material={m} refresh={fetchMaterials} />
            ))}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-stone-200">
        Upload Course Materials
      </h2>
      {/* Upload section */}
      <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
        {(!file || (file && selectedFolderId)) && (
          <>
            <div className="flex flex-col space-y-1">
              <label className="inline-block">
                <span className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-500 transition">
                  Select a file
                </span>

                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </div>
          </>
        )}
        {file && !selectedFolderId && (
          <div className="w-full flex space-x-2 items-center justify-between">
            <p className="text-sky-400 font-medium w-40 line-clamp-1">
              {file.name}
            </p>
            <div className="space-x-2">
              <Button variant="secondary" onClick={handleUpload}>
                Upload File
              </Button>
              <Button
                variant="tertiary"
                onClick={() => {
                  setFile(null);
                }}
                className="text-red-500 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialRow({ material, refresh }) {
  const { showLoading, hideLoading } = useLoading();
  const handleDelete = async () => {
    showLoading("Deleting File . . .");
    try {
      await api.delete(`/courses/materials/${material.id}`);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="flex justify-between items-center py-2">
      <p className="text-stone-200">{material.file_name}</p>

      <div className="space-x-3">
        <a href={material.file_url} target="_blank" className="text-blue-400">
          Open
        </a>

        {/* <a href={material.file_url} target="_blank">
          Download
        </a> */}

        <button onClick={handleDelete} className="text-red-400 cursor-pointer">
          Delete
        </button>
      </div>
    </div>
  );
}
