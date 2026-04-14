import { useEffect, useState } from "react";
import api from "../../api/api";
import { useCourse } from "../../context/CourseContext";
import { useLoading } from "../../context/LoadingContext";
import BackButton from "../../components/ui/BackButton";
import PageHeading from "../../components/ui/PageHeading";

export default function CourseMaterials() {
  const { currentCourse } = useCourse();
  const { showLoading, hideLoading } = useLoading();
  const [folders, setFolders] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);

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

  return (
    <div className="relative max-w-3xl mx-auto p-6 space-y-6">
      <div className="absolute top-6 left-1">
        <BackButton />
      </div>
      <div className="text-center">
        <PageHeading>Course Materials</PageHeading>
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-stone-200">Folders</h2>
        {folders.length === 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-stone-300">No folders</p>
          </div>
        )}
        {folders.length > 0 &&
          folders.map((folder) => (
            <FolderRow key={folder.id} folder={folder} />
          ))}
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
    </div>
  );
}

function MaterialRow({ material }) {
  return (
    <div className="flex justify-between items-center py-2">
      <p className="line-clamp-1 max-w-40 md:max-w-100 text-stone-200">
        {material.file_name}
      </p>

      <div className="space-x-3">
        <a
          href={material.file_url}
          download={material.file_name}
          className="text-blue-400"
        >
          Download
        </a>
      </div>
    </div>
  );
}

function FolderRow({ folder }) {
  const [showFiles, setShowFiles] = useState(false);
  return (
    <div key={folder.id} className="bg-gray-700 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-stone-200 font-bold">📁 {folder.name}</h3>
        <button
          className={`font-medium text-md ${showFiles ? "text-red-500" : "text-green-600"} cursor-pointer`}
          onClick={() => setShowFiles((prev) => !prev)}
        >
          {showFiles ? "Hide Files" : "Show Files"}
        </button>
      </div>
      {showFiles &&
        folder.materials.map((m) => <MaterialRow key={m.id} material={m} />)}
    </div>
  );
}
