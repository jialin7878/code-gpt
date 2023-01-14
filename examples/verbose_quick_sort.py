# Credits
# Referenced from
# https://www.linkedin.com/posts/svpino_9-ways-chatgpt-saves-me-hours-of-work-every-activity-7017126154633400320-idBU/?utm_source=share&utm_medium=member_desktop


def partition(array, low, high):
    pivot = array[high]
    i = low - 1
    for j in range(low, high):
        if array[j] <= pivot:
            i = i + 1
            (array[i], array[j]) = (array[j], array[i])
        (array[i + 1], array[high]) = (array[high], array[i + 1])
        return i + 1

def quickSort(array, low, high):
    if low < high:
        pi = partition(array, low, high)
        quickSort(array, low, pi - 1)
        quickSort(array, pi + 1, high)

data = [1, 7, 4, 1, 10, 9, -2]
print(data)

quickSort(data, 0, len(data) - 1)
print(data)