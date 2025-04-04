import { Prisma } from "@prisma/client";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { getFilteredUsers } from "@/lib/actions";

const useFilteredUsers = (
  query: string,
  debounceTime = 500
): {
  users: Prisma.UserGetPayload<object>[];
  isLoading: boolean;
  isError: boolean;
} => {
  const [debouncedValue] = useDebounce(query, debounceTime, {
    leading: true,
    trailing: true,
  });

  const [users, setUsers] = useState<Prisma.UserGetPayload<object>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (debouncedValue.length > 0) {
      const fetchData = async () => {
        setIsError(false);
        setIsLoading(true);

        try {
          const data = await getFilteredUsers(debouncedValue);
          setUsers(data);
        } catch {
          setIsError(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [debouncedValue]);

  return {
    users,
    isLoading,
    isError,
  };
};

export default useFilteredUsers;
